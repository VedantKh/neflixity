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
      setMoviesRatingsList(data.moviesByRating);
    } catch (error) {
      console.error("Failed to fetch movies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchResults = (
    moviesByRating: MovieObject[],
  ) => {
    setMoviesRatingsList(moviesByRating);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-1000 via-blue-900 to-gray-1000">
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-inter)]">
        <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-7xl">
          <h1 className="text-4xl font-bold text-center w-full text-white/90">
            {" "}
            Suflix{" "}
          </h1>
          <div className="w-full flex justify-center">
            <Search onSearchResults={handleSearchResults} />
          </div>
          <h3 className="text-2xl font-semibold text-white/90 tracking-tight ml-8">
            Top rated
          </h3>
          <MovieStack movies={moviesRatingsList} isLoading={isLoading} />
        </main>
      </div>
    </div>
  );
}
