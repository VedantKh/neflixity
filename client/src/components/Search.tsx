"use client";
import { useState, useEffect } from "react";
import { MovieObject } from "@/types/movie";
import KeywordObject from "@/types/keyword";
import GenreObject from "@/types/genre";

interface SearchProps {
  onSearchResults: (
    moviesByRating: MovieObject[],
    moviesByPopularity: MovieObject[]
  ) => void;
}

export default function Search({ onSearchResults }: SearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [genres, setGenres] = useState<GenreObject[]>([]);
  const [keywords, setKeywords] = useState<KeywordObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      // First, convert natural language to genre and keyword using Claude
      const [genreResponse, keywordResponse] = await Promise.all([
        fetch("/api/convert-to-genre", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchTerm,
            availableGenres: genres,
          }),
        }),
        fetch("/api/convert-to-keyword", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchTerm,
            availableKeywords: keywords,
          }),
        }),
      ]);

      const [genreResponseText, keywordResponseText] = await Promise.all([
        genreResponse.text(),
        keywordResponse.text(),
      ]);

      const { matchedGenre } = JSON.parse(genreResponseText);
      const { matchedKeywords } = JSON.parse(keywordResponseText);
      console.log("Matched Genre:", matchedGenre);
      console.log("Matched Keywords:", matchedKeywords, typeof matchedKeywords);

      // Convert single keyword to array and add any additional keywords you want to match
      const actualArray: string[] = JSON.parse(matchedKeywords);

      // Then fetch movies by both genre and keywords in parallel
      const [genreMovies, keywordMovies] = await Promise.all([
        fetch(`/api/movies?genre=${encodeURIComponent(matchedGenre)}`),
        fetch(
          `/api/movies-by-keyword?keywords=${encodeURIComponent(
            actualArray.join(",")
          )}`
        ),
      ]);

      const [genreData, keywordData] = await Promise.all([
        genreMovies.json(),
        keywordMovies.json(),
      ]);

      // Combine and deduplicate results
      const combinedRatings = [
        ...genreData.moviesByRating,
        ...keywordData.moviesByRating,
      ]
        .filter(
          (movie, index, self) =>
            index === self.findIndex((m) => m.id === movie.id)
        )
        .slice(0, 10);

      const combinedPopularity = [
        ...genreData.moviesByPopularity,
        ...keywordData.moviesByPopularity,
      ]
        .filter(
          (movie, index, self) =>
            index === self.findIndex((m) => m.id === movie.id)
        )
        .slice(0, 10);

      if (onSearchResults) {
        onSearchResults(combinedRatings, combinedPopularity);
      }
    } catch (error) {
      console.error("Failed to search movies:", error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch("/api/genres");
        const data = await response.json();
        setGenres(data.genres);
        console.log(data.genres);
      } catch (error) {
        console.error("Failed to fetch genres:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchKeywords = async () => {
      try {
        const response = await fetch("/api/keywords");
        const data = await response.json();
        setKeywords(data.keywords);
        console.log(data.keywords);
      } catch (error) {
        console.error("Failed to fetch keywords:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKeywords();
    fetchGenres();
  }, []);

  //   if (isLoading) {
  //     return <div>Loading genres...</div>;
  //   }

  return (
    <div className="flex gap-2 w-full max-w-md">
      <input
        type="text"
        placeholder="Search by genre..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearch();
          }
        }}
        className="flex-1 px-4 py-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
      />
      <button
        onClick={handleSearch}
        disabled={isSearching}
        className="p-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Search"
      >
        {isSearching ? (
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        )}
      </button>
    </div>
  );
}
