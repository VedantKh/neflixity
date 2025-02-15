import { MovieObject } from "@/types/movie";
import MoviePreview from "./MoviePreview";

interface MovieStackProps {
  movies: MovieObject[];
  isLoading?: boolean;
  title?: string;
}

export default function MovieStack({
  movies,
  isLoading = false,
  title,
}: MovieStackProps) {
  return (
    <div className="w-full">
      {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}

      <div className="relative">
        {/* Gradient masks for scroll indication - only show on larger screens */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 hidden sm:block" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 hidden sm:block" />

        {/* Grid container */}
        <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6 pb-4 px-4">
          {isLoading ? (
            // Show loading
            <div>
              <div className="w-full min-w-[350px] max-w-lg h-[158px] rounded-[32px] bg-white/[0.06] animate-pulse flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white/20 border-t-white/80 rounded-full animate-spin" />
              </div>
            </div>
          ) : movies.length > 0 ? (
            // Show movies
            movies.map((movie) => (
              <div key={movie.id}>
                <div className="min-w-[350px] max-w-lg mx-auto">
                  <MoviePreview movie={movie} />
                </div>
              </div>
            ))
          ) : (
            // Show message if no movies
            <div className="flex items-center justify-center w-full min-h-[400px] text-foreground/70">
              No movies found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
