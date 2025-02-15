"use client";
import Image from "next/image";
import Search from "@/components/Search";
import MovieStack from "@/components/MovieStack";
import { useState, useEffect } from "react";
import { MovieObject } from "@/types/movie";

export default function Home() {
  const [moviesRatingsList, setMoviesRatingsList] = useState<MovieObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial load of movies (no filter)
    fetchMovies();
  }, []);

  const fetchMovies = async (genre?: string) => {
    setIsLoading(true);
    try {
      const url = genre
        ? `/api/movies?genre=${encodeURIComponent(genre)}`
        : "/api/movies";
      const response = await fetch(url);
      const data = await response.json();
      setMoviesRatingsList(data.moviesByPopularity);
    } catch (error) {
      console.error("Failed to fetch movies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchResults = (moviesByRating: MovieObject[]) => {
    setMoviesRatingsList(moviesByRating);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Enhanced gradient blur effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-[128px]" />
      </div>

      {/* Content */}
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-dm-sans)] relative z-10">
        <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-7xl">
          <h1 className="text-6xl font-[200] text-center w-full text-white/90 font-[family-name:var(--font-dm-sans)]">
            netflixity.
          </h1>
          <div className="w-full flex justify-center mb-4">
            <Search onSearchResults={handleSearchResults} />
          </div>

          <MovieStack movies={moviesRatingsList} isLoading={isLoading} />
        </main>
      </div>
    </div>
  );
}
