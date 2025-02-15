"use client";
import { useState } from "react";
import { MovieObject } from "@/types/movie";
import KeywordObject from "@/types/keyword";
import GenreObject from "@/types/genre";
import LoadingSpinner from "./LoadingSpinner";
import ExamplePrompts from "./ExamplePrompts";

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
  const [showExamples, setShowExamples] = useState(true);

  const examplePrompts = [
    "movies about time travel and parallel universes",
    "films with strong female leads fighting for justice",
    "something with beautiful visuals and deep philosophical themes",
    "artificial intelligence gone wrong",
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setIsVectorSearching(true);
    setSearchProgress("Searching for similar movies...");

    try {
      // Call our Next.js API endpoint for vector search
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

      const { results } = await semanticResponse.json();

      if (!results || !Array.isArray(results)) {
        throw new Error("Invalid search results format");
      }

      // Results are already MovieObjects with similarity scores
      const movies = results as MovieObject[];

      console.log(movies);

      // Take top 12 results
      const finalResults = movies.slice(0, 12);

      if (onSearchResults) {
        // Pass the same results for both parameters since they're already sorted
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
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowExamples(false);
          }}
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
        {showExamples && !isVectorSearching && (
          <div className="mt-4 pl-4 pr-4">
            <ExamplePrompts prompts={examplePrompts} />
          </div>
        )}
      </div>
    </div>
  );
}
