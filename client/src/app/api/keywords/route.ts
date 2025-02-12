import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

export async function GET() {
  try {
    // Read the CSV file
    const filePath = path.join(
      process.cwd(),
      "src/data/raw_data/keywords.csv"
    );

    const fileContent = await fs.readFile(filePath, {
      encoding: "utf-8",
      flag: "r",
    });
    const lines = fileContent.split("\n").slice(0, 1001).join("\n");

    const records = parse(lines, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
      skip_records_with_error: true,
    });

    // Extract and deduplicate keywords
    const uniqueKeywords = new Map();

    records.forEach((record: any) => {
      try {
        const cleanedKeywords = record.keywords
          .replace(/'/g, '"')
          .replace(/\s+/g, " ")
          .trim();

        const keywordsData = JSON.parse(cleanedKeywords || "[]");

        if (Array.isArray(keywordsData)) {
          keywordsData.forEach((keyword: { id: number; name: string }) => {
            uniqueKeywords.set(keyword.id, keyword);
          });
        }
      } catch (e) {
        // Skip invalid genre entries
      }
    });

    // Convert Map to array and sort by name
    const keywords = Array.from(uniqueKeywords.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("Error processing keywords:", error);
    return NextResponse.json(
      { error: "Failed to process keywords data" },
      { status: 500 }
    );
  }
}
