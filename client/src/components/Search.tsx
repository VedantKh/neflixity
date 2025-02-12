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
  const [documents, setDocuments] = useState<string[]>([]);
  const [movieIds, setMovieIds] = useState<number[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      console.log("Starting search with documents:", documents.length);
      console.log("Number of movie IDs:", movieIds.length);
      console.log("First few movie IDs:", movieIds.slice(0, 5));

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

      // Convert single keyword to array and add any additional keywords you want to match
      const actualArray: string[] = JSON.parse(matchedKeywords);

      // Perform semantic search if documents are loaded
      if (documents.length > 0) {
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
        console.log("Semantic search results:", semanticResults);

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
        console.log("Final movies data:", movies);

        if (onSearchResults) {
          onSearchResults(movies, movies);
        }
      }
    } catch (error) {
      console.error("Failed to search movies:", error);
    } finally {
      setIsSearching(false);
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
    <form onSubmit={handleSearch} className="w-full max-w-2xl">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search movies..."
        className="w-full px-4 py-2 rounded-lg bg-white/10 text-white/90 placeholder:text-white/50 border border-white/20 focus:outline-none focus:border-white/40"
      />
    </form>
  );
}
