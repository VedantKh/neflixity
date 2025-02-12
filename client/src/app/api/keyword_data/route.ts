import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import * as path from "path";
import * as fs from "fs/promises";

export async function GET() {
  try {
    console.log("Starting to fetch keywords data...");

    // Get the absolute path to the CSV file
    const filePath = path.join(process.cwd(), "src/data/raw_data/keywords.csv");
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
    console.log(`Successfully parsed ${records.length} keyword records`);

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error reading keywords data:", error);
    return NextResponse.json(
      { error: "Failed to load keywords data" },
      { status: 500 }
    );
  }
}
