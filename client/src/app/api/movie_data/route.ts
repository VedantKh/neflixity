import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

// Define interface for movie record
interface MovieRecord {
  id: string;
  popularity: string;
  title: string;
  [key: string]: string; // Allow for other columns from CSV
}

export async function GET() {
  try {
    console.log("Starting to fetch movies data...");

    // Get the absolute path to the CSV file
    const filePath = path.join(
      process.cwd(),
      "src/data/raw_data/movies_metadata.csv"
    );
    console.log("File path:", filePath);

    // Read the CSV file
    console.log("Reading CSV file...");
    const fileContent = await fs.readFile(filePath, "utf-8");
    console.log("CSV file read successfully");

    // Parse CSV content with type annotation
    console.log("Parsing CSV content...");
    const records: MovieRecord[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      skip_records_with_error: true,
    });
    console.log(`Successfully parsed ${records.length} movie records`);

    // Filter records by popularity and ensure valid IDs
    const filteredRecords = records.filter((record: MovieRecord) => {
      // Skip records with invalid IDs or popularity
      const id = parseInt(record.id);
      const popularity = parseFloat(record.popularity);
      return !isNaN(id) && !isNaN(popularity) && popularity >= 0.1;
    });
    console.log(
      `Returning ${filteredRecords.length} records after filtering by popularity and validity`
    );

    return NextResponse.json(filteredRecords);
  } catch (error) {
    console.error("Error reading movies data:", error);
    return NextResponse.json(
      { error: "Failed to load movies data" },
      { status: 500 }
    );
  }
}
