"use client";
import { useState, useEffect } from "react";
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
  const [genres, setGenres] = useState<GenreObject[]>([]);
  const [keywords, setKeywords] = useState<KeywordObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<string[]>([]);
  const [movieIds, setMovieIds] = useState<number[]>([]);
  const [isVectorSearching, setIsVectorSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState<string>("");
  const [totalMovies, setTotalMovies] = useState<number>(0);
  const [foundIndices, setFoundIndices] = useState<boolean>(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      console.log("Starting search with documents:", documents.length);
      console.log("Number of movie IDs:", movieIds.length);
      console.log("First few movie IDs:", movieIds.slice(0, 5));

      // Perform semantic search if documents are loaded
      if (documents.length > 0) {
        setIsVectorSearching(true);
        setSearchProgress(`Analyzing ${documents.length} movies...`);
        setTotalMovies(documents.length);

        const semanticResponse = await fetch(
          "http://localhost:8080/api/vector_search",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: searchTerm,
              documents: documents,
              ids: movieIds,
            }),
          }
        );

        const semanticResults = await semanticResponse.json();
        setSearchProgress("Found matching movies, retrieving details...");
        setFoundIndices(true);

        // Create a map of movie IDs to their scores
        const idToScore = new Map(
          semanticResults.results.map((r: any) => [r.movie_id, r.score])
        );

        const semanticMovieIds = semanticResults.results.map(
          (r: any) => r.movie_id
        );
        console.log("Retrieved movie IDs:", semanticMovieIds);

        const movieDetailsResponse = await fetch("/api/movies-by-ids", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ids: semanticMovieIds,
          }),
        });

        const { movies } = await movieDetailsResponse.json();

        // Add scores to movies and sort by score
        const moviesWithScores = movies.map((movie: MovieObject) => ({
          ...movie,
          score: idToScore.get(movie.id) || 0,
        }));

        // First sort by popularity
        const sortedByPopularity = moviesWithScores
          .sort((a: MovieObject, b: MovieObject) => b.popularity - a.popularity)
          .slice(0, 10);

        // Then sort those top 10 by semantic similarity score
        const finalResults = sortedByPopularity.sort(
          (a: MovieObject, b: MovieObject) => (b.score || 0) - (a.score || 0)
        );

        console.log("Final sorted movies data:", finalResults);

        if (onSearchResults) {
          onSearchResults(finalResults, finalResults);
        }
      }
    } catch (error) {
      console.error("Failed to search movies:", error);
    } finally {
      setIsSearching(false);
      setIsVectorSearching(false);
      setSearchProgress("");
      setFoundIndices(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesResponse, keywordsResponse] = await Promise.all([
          fetch("/api/movie_data"),
          fetch("/api/keyword_data"),
        ]);

        const [moviesData, keywordsData] = await Promise.all([
          moviesResponse.json(),
          keywordsResponse.json(),
        ]);

        const embedResponse = await fetch(
          "http://localhost:8080/api/make_embeddings",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              movies: moviesData,
              keywords: keywordsData,
            }),
          }
        );

        const { documents: preparedDocs, ids: preparedIds } =
          await embedResponse.json();
        setDocuments(preparedDocs);
        setMovieIds(preparedIds);
      } catch (error) {
        console.error("Error loading documents:", error);
      }
    };

    const fetchGenres = async () => {
      try {
        const response = await fetch("/api/genres");
        const data = await response.json();
        setGenres(data.genres);
      } catch (error) {
        console.error("Failed to fetch genres:", error);
      }
    };

    const fetchKeywords = async () => {
      try {
        const response = await fetch("/api/keywords");
        const data = await response.json();
        setKeywords(data.keywords);
      } catch (error) {
        console.error("Failed to fetch keywords:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    fetchGenres();
    fetchKeywords();
  }, []);

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
