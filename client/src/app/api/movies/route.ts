import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { MovieObject } from "@/types/movie";

export async function GET(request: Request) {
  try {
    // Get genre and keyword from query params
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get("genre")?.toLowerCase();
    const keyword = searchParams.get("keyword")?.toLowerCase();

    // Read both CSV files
    const moviesFilePath = path.join(
      process.cwd(),
      "src/data/raw_data/movies_metadata_filtered.csv"
    );

    const [moviesContent] = await Promise.all([
      fs.readFile(moviesFilePath, { encoding: "utf-8", flag: "r" }),
    ]);


    // Parse movies data
    const moviesLines = moviesContent.split("\n").slice(0, 1001).join("\n");
    const moviesRecords = parse(moviesLines, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
      skip_records_with_error: true,
    });

    // Transform all records
    const allMovies: MovieObject[] = moviesRecords.map((record: any) => {
      const genres = (() => {
        try {
          const cleanedGenres = record.genres
            .replace(/'/g, '"')
            .replace(/\s+/g, " ")
            .trim();

          const genresData = JSON.parse(cleanedGenres || "[]");

          if (!Array.isArray(genresData)) return [];
          return genresData.map((g: { id: number; name: string }) => ({
            id: g.id,
            name: g.name,
          }));
        } catch (e) {
          return [];
        }
      })();
      const movieObj = {
        id: parseInt(record.id),
        title: record.title,
        tagline: record.tagline || null,
        overview: record.overview,
        poster_path: record.poster_path || null,
        release_date: record.release_date,
        vote_average: parseFloat(record.vote_average),
        genres,
        adult: record.adult === "True",
        original_language: record.original_language,
        popularity: parseFloat(record.popularity),
        vote_count: parseInt(record.vote_count),
        video: record.video === "True",
        original_title: record.original_title,
        imdb_id: record.imdb_id || null,
      };

      // Log titles of movies that match the keyword
    //   if (keyword && movieIdsWithKeyword.has(movieObj.id)) {
    //     // console.log(`Movie with keyword "${keyword}":`, movieObj.title);
    //   }

      return movieObj;
    });

    // Filter by both genre and keyword if specified
    const filteredMovies = allMovies.filter((movie) => {
      const matchesGenre =
        !genre || movie.genres.some((g) => g.name.toLowerCase() === genre);
      //   const matchesKeyword = !keyword || movieIdsWithKeyword.has(movie.id);
      return matchesGenre && movie.vote_count > 100; // && matchesKeyword
    });

    // Sort by rating and popularity as before
    const topMoviesByRating = filteredMovies
      .sort((a, b) => b.vote_average - a.vote_average)
      .slice(0, 12);

    const topMoviesByPopularity = filteredMovies
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 12);

    return NextResponse.json({
      moviesByRating: topMoviesByRating,
      moviesByPopularity: topMoviesByPopularity,
    });
  } catch (error) {
    console.error("Error processing CSV:", error);
    return NextResponse.json(
      { error: "Failed to process movies data" },
      { status: 500 }
    );
  }
}
