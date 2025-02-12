import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

export async function GET() {
  try {
    // Read the CSV file
    const filePath = path.join(
      process.cwd(),
      "src/data/raw_data/movies_metadata.csv"
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

    // Extract and deduplicate genres
    const uniqueGenres = new Map();

    records.forEach((record: any) => {
      try {
        const cleanedGenres = record.genres
          .replace(/'/g, '"')
          .replace(/\s+/g, " ")
          .trim();

        const genresData = JSON.parse(cleanedGenres || "[]");

        if (Array.isArray(genresData)) {
          genresData.forEach((genre: { id: number; name: string }) => {
            uniqueGenres.set(genre.id, genre);
          });
        }
      } catch (e) {
        // Skip invalid genre entries
      }
    });

    // Convert Map to array and sort by name
    const genres = Array.from(uniqueGenres.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return NextResponse.json({ genres });
  } catch (error) {
    console.error("Error processing genres:", error);
    return NextResponse.json(
      { error: "Failed to process genres data" },
      { status: 500 }
    );
  }
}
