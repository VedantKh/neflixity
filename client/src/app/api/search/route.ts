import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin } from "@/utils/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Filter out all movies with vote_count below 50 
// Filter out all movies with popularity below 1

// in UI, show example types of prompts in typewriter format
// same UI show generation post hoc (RAG)

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key not configured");
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      console.error("Invalid request body:", { query });
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    console.log("Generating embedding for query:", query);

    // Generate embedding for the search query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const embedding = embeddingResponse.data[0].embedding;
    console.log("Generated embedding with dimensions:", embedding.length);

    // Search in Supabase using the match_movies function with a lower threshold
    const { data, error } = await supabaseAdmin.rpc("match_movies", {
      query_embedding: embedding,
      match_threshold: 0.0, // Lowered threshold for more results
      match_count: 20, // Increased count to get more candidates
    });

    if (error) {
      console.error("Supabase search error:", error);

      // Handle timeout specifically
      if (error.code === "57014") {
        return NextResponse.json(
          {
            error: "Search took too long. Please try a more specific query.",
            details: "Statement timeout",
            code: error.code,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to search movies",
          details: error.message,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 }
      );
    }

    if (!data || !Array.isArray(data)) {
      console.error("Invalid database response:", data);
      return NextResponse.json(
        { error: "Invalid response from database" },
        { status: 500 }
      );
    }

    // Filter results by similarity score if needed
    const filteredResults = data.filter((result) => result.similarity > 0.0);

    // Sort by popularity (assuming higher vote_count means more popular)
    // Then remove 10 least popular movies and sort by similarity
    const processedResults = filteredResults
      .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0)) // Sort by vote_count descending
      .slice(8)
      .sort((a, b) => b.similarity - a.similarity); // Sort by similarity descending

    console.log("Found matches:", processedResults.length);
    return NextResponse.json({
      results: processedResults,
    });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
