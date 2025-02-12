import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(request: Request) {
  try {
    const { query, availableKeywords } = await request.json();

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Given this list of movie keywords: ${JSON.stringify(
            availableKeywords.map((k: { name: string }) => k.name)
          )},
          what would be the most appropriate keywords for this query: "${query}"?
          Respond with a list of the strings of exact keyword names for as many keywords that best fit the query (up to 10), nothing else.`,
        },
      ],
    });

    const matchedKeywords: string = message.content[0].text;
    console.log(matchedKeywords);

    return NextResponse.json({ matchedKeywords });
  } catch (error) {
    console.error("Error in convert-to-keyword:", error);
    return NextResponse.json(
      { error: "Failed to convert query to keyword" },
      { status: 500 }
    );
  }
}
