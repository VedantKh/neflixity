import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { MovieObject } from "@/types/movie";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keywordsParam = searchParams.get("keywords");

    if (!keywordsParam) {
      return NextResponse.json({ moviesByRating: [], moviesByPopularity: [] });
    }

    const keywords = keywordsParam
      .split(",")
      .map((k) => k.toLowerCase().trim());
    console.log("Searching for keywords:", keywords);

    const [moviesContent, keywordsContent] = await Promise.all([
      fs.readFile(
        path.join(process.cwd(), "src/data/raw_data/movies_metadata.csv"),
        { encoding: "utf-8" }
      ),
      fs.readFile(path.join(process.cwd(), "src/data/raw_data/keywords.csv"), {
        encoding: "utf-8",
      }),
    ]);

    // Parse keywords data first
    const keywordsRecords = parse(keywordsContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      skip_records_with_error: true,
    });

    // Create a map of movie IDs to their keyword match counts
    const movieKeywordMatches = new Map<number, Set<string>>();

    keywordsRecords.forEach((record: any) => {
      try {
        const movieId = parseInt(record.id);
        const movieKeywords = JSON.parse(record.keywords.replace(/'/g, '"'));

        const matchedKeywords = keywords.filter((searchKeyword) =>
          movieKeywords.some(
            (k: { name: string }) => k.name.toLowerCase() === searchKeyword
          )
        );

        if (matchedKeywords.length > 0) {
          movieKeywordMatches.set(movieId, new Set(matchedKeywords));
        }
      } catch (e) {
        // Skip malformed records
      }
    });

    console.log(
      `Found ${movieKeywordMatches.size} movies with at least one keyword match`
    );

    // Parse movies data
    const moviesRecords = parse(moviesContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
      skip_records_with_error: true,
    });

    // Transform and filter movies
    const allMovies: (MovieObject & { keywordMatches: string[] })[] =
      moviesRecords
        .map((record: any) => {
          try {
            const movieId = parseInt(record.id);
            const matchedKeywords = movieKeywordMatches.get(movieId);

            if (!matchedKeywords) return null;

            const genres = JSON.parse(
              record.genres.replace(/'/g, '"') || "[]"
            ).map((g: { id: number; name: string }) => ({
              id: g.id,
              name: g.name,
            }));

            return {
              id: movieId,
              title: record.title,
              tagline: record.tagline || null,
              overview: record.overview,
              poster_path: record.poster_path || null,
              release_date: record.release_date,
              vote_average: parseFloat(record.vote_average),
              genres,
              adult: record.adult === "True",
              original_language: record.original_language,
              popularity: parseFloat(record.popularity),
              vote_count: parseInt(record.vote_count),
              video: record.video === "True",
              original_title: record.original_title,
              keywordMatches: Array.from(matchedKeywords),
            };
          } catch (e) {
            return null;
          }
        })
        .filter(
          (movie): movie is MovieObject & { keywordMatches: string[] } =>
            movie !== null && movie.vote_count > 0
        );

    // Sort by number of keyword matches (descending)
    const moviesByKeywordMatches = allMovies
      .sort((a, b) => b.keywordMatches.length - a.keywordMatches.length)
      .slice(0, 10);

    console.log("\nTop 10 movies by keyword matches:");
    moviesByKeywordMatches.forEach((movie) => {
      console.log(
        `\n"${movie.title}" matches ${movie.keywordMatches.length} keywords:`
      );
      console.log("Matched keywords:", movie.keywordMatches.join(", "));
    });

    // Regular sorting for rating and popularity
    const moviesByRating = allMovies
      .sort((a, b) => b.vote_average - a.vote_average)
      .slice(0, 10);

    const moviesByPopularity = allMovies
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10);

    return NextResponse.json({
      moviesByRating,
      moviesByPopularity,
      moviesByKeywordMatches, // Added this to the response
    });
  } catch (error) {
    console.error("Error processing CSV:", error);
    return NextResponse.json(
      { error: "Failed to process movies data" },
      { status: 500 }
    );
  }
}
