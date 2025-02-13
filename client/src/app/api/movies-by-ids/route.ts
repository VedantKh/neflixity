import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { MovieObject } from "@/types/movie";

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();

    const filePath = path.join(
      process.cwd(),
      "src/data/raw_data/movies_metadata.csv"
    );

    const fileContent = await fs.readFile(filePath, {
      encoding: "utf-8",
      flag: "r",
    });

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      skip_records_with_error: true,
    });

    const movies: MovieObject[] = records
      .filter((record: any) => ids.includes(parseInt(record.id)))
      .map((record: any) => ({
        id: parseInt(record.id),
        title: record.title,
        tagline: record.tagline || null,
        overview: record.overview,
        poster_path: record.poster_path || null,
        release_date: record.release_date,
        vote_average: parseFloat(record.vote_average),
        genres: JSON.parse(record.genres.replace(/'/g, '"')),
        adult: record.adult === "True",
        original_language: record.original_language,
        popularity: parseFloat(record.popularity),
        vote_count: parseInt(record.vote_count),
        video: record.video === "True",
        original_title: record.original_title,
        imdb_id: record.imdb_id,
      }));

    return NextResponse.json({ movies });
  } catch (error) {
    console.error("Error fetching movies by IDs:", error);
    return NextResponse.json(
      { error: "Failed to fetch movies" },
      { status: 500 }
    );
  }
}
