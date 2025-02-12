import GenreObject from "./genre";

export interface MovieObject {
  id: number;
  title: string;
  tagline: string | null;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  genres: GenreObject[];
  adult: boolean;
  original_language: string;
  popularity: number;
  vote_count: number;
  video: boolean;
  original_title: string;
  score?: number;
}
