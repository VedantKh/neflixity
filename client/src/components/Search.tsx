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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

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
            }),
          }
        );

        const semanticResults = await semanticResponse.json();
        console.log("Semantic Search Results:");
        semanticResults.results.forEach((result: any, index: number) => {
          console.log(`${index + 1}. Score: ${result.score.toFixed(2)}%`);
          console.log(`   Document: ${result.document}`);
        });
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

    const loadDocuments = async () => {
      try {
        // Fetch and prepare documents
        const [moviesResponse, keywordsResponse] = await Promise.all([
          fetch("/api/movie_data"),
          fetch("/api/keyword_data"),
        ]);

        const [moviesData, keywordsData] = await Promise.all([
          moviesResponse.json(),
          keywordsResponse.json(),
        ]);

        // Make the call to Flask API to prepare documents
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

        const { documents: preparedDocs } = await embedResponse.json();
        setDocuments(preparedDocs);
        console.log(preparedDocs);
      } catch (error) {
        console.error("Error loading documents:", error);
      }
    };

    fetchKeywords();
    fetchGenres();
    loadDocuments();
  }, []);

  //   if (isLoading) {
  //     return <div>Loading genres...</div>;
  //   }

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
