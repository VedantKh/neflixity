import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import path from "path";
import { MovieObject } from "../types/movie.js";
import KeywordObject from "../types/keyword.js";
import GenreObject from "../types/genre.js";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MovieMetadataRow {
  id: string;
  title: string;
  tagline: string | null;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: string;
  genres: string; // JSON string
  adult: string;
  original_language: string;
  popularity: string;
  vote_count: string;
  video: string;
  original_title: string;
  imdb_id: string;
}

interface MovieKeywordsRow {
  id: string;
  keywords: string; // JSON string of KeywordObject[]
}

function fixJsonString(str: string): string {
  try {
    // First attempt to parse as is - it might be valid JSON already
    JSON.parse(str);
    return str;
  } catch (e) {
    // If parsing fails, try to fix the string
    let fixed = str
      // Replace single quotes with double quotes
      .replace(/'/g, '"')
      // Fix any escaped single quotes that should remain as single quotes
      .replace(/\\"/g, "'")
      // Handle any remaining problematic characters
      .replace(/\\+/g, "\\")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t")
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Ensure property names are quoted

    try {
      // Verify the fixed string is valid JSON
      JSON.parse(fixed);
      return fixed;
    } catch (e) {
      // If still invalid, return empty array as fallback
      console.warn(`Could not fix JSON string: ${str}`);
      return "[]";
    }
  }
}

async function loadKeywords(): Promise<Map<number, string[]>> {
  const keywordsMap = new Map<number, string[]>();

  return new Promise((resolve, reject) => {
    createReadStream(path.join(process.cwd(), "src/data/raw_data/keywords.csv"))
      .pipe(parse({ columns: true }))
      .on("data", (row: MovieKeywordsRow) => {
        try {
          const fixedJson = fixJsonString(row.keywords);
          const keywords = JSON.parse(fixedJson) as KeywordObject[];
          const keywordNames = keywords.map((k) => k.name);
          keywordsMap.set(parseInt(row.id), keywordNames);
        } catch (e) {
          console.error(`Error parsing keywords for movie ${row.id}:`, e);
        }
      })
      .on("end", () => resolve(keywordsMap))
      .on("error", reject);
  });
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateEmbeddingWithRetry(
  text: string,
  retries = 3
): Promise<number[]> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return response.data[0].embedding;
    } catch (error: any) {
      if (error?.status === 429 && i < retries - 1) {
        // Get retry delay from headers or use default
        const retryAfter = parseInt(error?.headers?.["retry-after"] || "1");
        console.log(`Rate limited. Waiting ${retryAfter}s before retry...`);
        await sleep(retryAfter * 1000);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Failed to generate embedding after retries");
}

async function processMovie(
  row: MovieMetadataRow,
  keywordsMap: Map<number, string[]>,
  processedIds: Set<number>
): Promise<void> {
  try {
    const movieId = parseInt(row.id);

    // Skip if we've already processed this movie
    if (processedIds.has(movieId)) {
      console.log(`Skipping duplicate movie ID: ${movieId}`);
      return;
    }

    // Parse genres from JSON string
    const fixedGenresJson = fixJsonString(row.genres || "[]");
    const genres = JSON.parse(fixedGenresJson) as GenreObject[];

    // Get keywords for this movie
    const keywords = keywordsMap.get(movieId) || [];

    // Create embedding text
    const embeddingText = `Title: ${row.title}. Description: ${
      row.overview
    }. Keywords: ${keywords.join(", ")}`;

    // Generate embedding with retry logic
    const embedding = await generateEmbeddingWithRetry(embeddingText);

    // Create movie object with proper types
    const movieObject: MovieObject & { embedding: number[] } = {
      id: movieId,
      title: row.title,
      tagline: row.tagline,
      overview: row.overview,
      poster_path: row.poster_path,
      release_date: row.release_date || null,
      vote_average: parseFloat(row.vote_average) || 0,
      genres: genres,
      adult: row.adult.toLowerCase() === "true",
      original_language: row.original_language,
      popularity: parseFloat(row.popularity) || 0,
      vote_count: parseInt(row.vote_count) || 0,
      video: row.video.toLowerCase() === "true",
      original_title: row.original_title,
      imdb_id: row.imdb_id,
      embedding: embedding,
    };

    // Insert into Supabase
    const { error } = await supabaseAdmin.from("movies").insert(movieObject);

    if (error) {
      throw error;
    }

    // Mark this ID as processed
    processedIds.add(movieId);
    return;
  } catch (e) {
    throw e;
  }
}

async function processAndLoadMovies(): Promise<void> {
  const keywordsMap = await loadKeywords();
  console.log("Keywords loaded successfully");

  let processedCount = 0;
  let errorCount = 0;
  const batchSize = 10; // Process 10 movies at a time
  let currentBatch: Promise<void>[] = [];
  const processedIds = new Set<number>();

  return new Promise((resolve, reject) => {
    const parser = parse({ columns: true });

    createReadStream(
      path.join(process.cwd(), "src/data/raw_data/movies_metadata.csv")
    )
      .pipe(parser)
      .on("data", async (row: MovieMetadataRow) => {
        // Pause the parser until the current batch is processed
        parser.pause();

        currentBatch.push(
          processMovie(row, keywordsMap, processedIds)
            .then(() => {
              processedCount++;
              if (processedCount % 100 === 0) {
                console.log(
                  `Processed ${processedCount} movies (${errorCount} errors)`
                );
              }
            })
            .catch((e) => {
              errorCount++;
              console.error(`Error processing movie ${row.id}:`, e);
            })
        );

        if (currentBatch.length >= batchSize) {
          // Wait for the current batch to complete
          await Promise.all(currentBatch);
          currentBatch = [];
          // Resume processing
          parser.resume();
        } else {
          parser.resume();
        }
      })
      .on("end", async () => {
        // Process any remaining movies
        if (currentBatch.length > 0) {
          await Promise.all(currentBatch);
        }
        console.log(
          `Finished processing ${processedCount} movies with ${errorCount} errors`
        );
        resolve();
      })
      .on("error", (error) => {
        console.error("Error reading CSV:", error);
        reject(error);
      });
  });
}

// Run the script
processAndLoadMovies().catch(console.error);
