import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: "../../.env.local" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testEmbedding() {
  const sampleMovie = {
    title: "The Matrix",
    overview:
      "A computer programmer discovers a mysterious world where nothing is as it seems.",
    keywords: ["sci-fi", "virtual reality", "action"],
  };

  const embeddingText = `Title: ${sampleMovie.title}. Description: ${
    sampleMovie.overview
  }. Keywords: ${sampleMovie.keywords.join(", ")}`;

  console.log("Embedding text:", embeddingText);

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: embeddingText,
  });

  console.log(
    "Embedding vector (first 5 dimensions):",
    response.data[0].embedding.slice(0, 5)
  );
}

testEmbedding().catch(console.error);
