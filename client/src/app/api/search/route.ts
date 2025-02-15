import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin } from "@/utils/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const task = 'Given a movie query, analyze the plot elements and themes to retrieve relevant movie names and descriptions that match the query'

    // Format query to match stored embedding format
    const formattedQuery = `Instruct: ${task}\nQuery: ${query}`;
    console.log("Formatted query:", formattedQuery);

    // Generate embedding for the search query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: formattedQuery,
    });

    const embedding = embeddingResponse.data[0].embedding;
    console.log("Generated embedding with dimensions:", embedding.length);

    // Search in Supabase using the match_movies function with a lower threshold
    const { data, error } = await supabaseAdmin.rpc("match_movies_new", {
      query_embedding: embedding,
      match_threshold: 0.0, // Even more permissive threshold
      match_count: 50, // Get more candidates
      min_vote_count: 20, // Lower minimum vote count
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

    // Log raw results
    console.log("Raw results:", JSON.stringify(data.slice(0, 3), null, 2));

    const filteredResults = data;
    console.log("After similarity filter:", filteredResults.length, "results");
    console.log(
      "Top 3 similarities:",
      filteredResults.slice(0, 3).map((r) => r.similarity)
    );

    // First sort by similarity, then use popularity as a tiebreaker
    const processedResults = filteredResults.sort((a, b) => {
      // First sort by similarity
      const similarityDiff = b.similarity - a.similarity;
      if (Math.abs(similarityDiff) > 0.01) {
        // If similarity difference is significant
        return similarityDiff;
      }
      // Use popularity as tiebreaker
      return (b.vote_count || 0) - (a.vote_count || 0);
    });

    console.log(
      "Final top 3 results:",
      JSON.stringify(processedResults.slice(0, 3), null, 2)
    );

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
