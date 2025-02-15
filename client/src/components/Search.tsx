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

    setIsVectorSearching(true);
    setIsSearching(true);
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
      <form onSubmit={handleSearch} className="w-full relative">
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowExamples(false);
          }}
          placeholder="Search movies..."
          autoFocus
          className="w-full mt-4 px-6 py-3 pr-12 rounded-2xl bg-white/[0.07] text-white/90 
            placeholder:text-white/40 outline-none focus:bg-white/[0.09] 
            backdrop-blur-xl shadow-lg
            transition-all duration-300 focus:scale-[1.01]"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 mt-2 -translate-y-1/2 p-2 
            text-white/60 hover:text-white/90 transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-white/20 rounded-xl
            sm:hidden" // Only show on mobile
          aria-label="Search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
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
