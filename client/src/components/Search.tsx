"use client";
import { useState } from "react";
import { MovieObject } from "@/types/movie";
import KeywordObject from "@/types/keyword";
import GenreObject from "@/types/genre";
import LoadingSpinner from "./LoadingSpinner";

interface SearchProps {
  onSearchResults: (
    moviesByRating: MovieObject[],
    moviesByPopularity: MovieObject[]
  ) => void;
}

export default function Search({ onSearchResults }: SearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isVectorSearching, setIsVectorSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState<string>("");
  const [foundIndices, setFoundIndices] = useState<boolean>(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setIsVectorSearching(true);
    setSearchProgress("Searching for similar movies...");

    try {
      // Call our new Next.js API endpoint for vector search
      const semanticResponse = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchTerm,
        }),
      });

      if (!semanticResponse.ok) {
        throw new Error(`Search failed: ${semanticResponse.statusText}`);
      }

      const semanticResults = await semanticResponse.json();

      if (!semanticResults.results || !Array.isArray(semanticResults.results)) {
        throw new Error("Invalid search results format");
      }

      setSearchProgress("Found matching movies, retrieving details...");
      setFoundIndices(true);

      // Extract movie IDs from the results
      const semanticMovieIds = semanticResults.results.map((r: any) => r.id);

      // Create a map of movie IDs to their similarity scores
      const idToScore = new Map(
        semanticResults.results.map((r: any) => [r.id, r.similarity])
      );

      // Fetch movie details for the found IDs
      const movieDetailsResponse = await fetch("/api/movies-by-ids", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: semanticMovieIds,
        }),
      });

      if (!movieDetailsResponse.ok) {
        throw new Error(
          `Failed to fetch movie details: ${movieDetailsResponse.statusText}`
        );
      }

      const { movies } = await movieDetailsResponse.json();

      if (!movies || !Array.isArray(movies)) {
        throw new Error("Invalid movie details format");
      }

      // Add similarity scores to movies
      const moviesWithScores = movies.map((movie: MovieObject) => ({
        ...movie,
        score: idToScore.get(movie.id) || 0,
      })) as MovieObject[];

      // Sort by popularity and score
      const sortedByPopularity = moviesWithScores
        .sort((a: MovieObject, b: MovieObject) => b.popularity - a.popularity)
        .slice(0, 10);

      const finalResults = sortedByPopularity.sort(
        (a: MovieObject, b: MovieObject) => (b.score || 0) - (a.score || 0)
      );

      if (onSearchResults) {
        onSearchResults(finalResults, finalResults);
      }
    } catch (error) {
      console.error("Failed to search movies:", error);
      setSearchProgress("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
      setIsVectorSearching(false);
      setFoundIndices(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSearch} className="w-full">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search movies..."
          autoFocus
          className="w-full mt-4 px-6 py-3 rounded-2xl bg-white/[0.07] text-white/90 
            placeholder:text-white/40 outline-none focus:bg-white/[0.09] 
            backdrop-blur-xl shadow-lg
            transition-all duration-300 focus:scale-[1.01]"
        />
      </form>
      <div className="h-20 relative">
        {isVectorSearching && <LoadingSpinner message={searchProgress} />}
      </div>
    </div>
  );
}
