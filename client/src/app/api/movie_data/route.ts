import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

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

    // Parse CSV content
    console.log("Parsing CSV content...");
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });
    console.log(`Successfully parsed ${records.length} movie records`);

    // Limit to first 1000 records
    const limitedRecords = records.slice(0, 1000);
    console.log(`Returning first ${limitedRecords.length} records`);

    return NextResponse.json(limitedRecords);
  } catch (error) {
    console.error("Error reading movies data:", error);
    return NextResponse.json(
      { error: "Failed to load movies data" },
      { status: 500 }
    );
  }
}
