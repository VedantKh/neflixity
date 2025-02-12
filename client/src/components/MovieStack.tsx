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
        {/* Gradient masks for scroll indication */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10" />

        {/* Scrollable container - removed left padding */}
        <div className="overflow-x-auto flex gap-4 pr-4 pb-4 snap-x snap-mandatory scrollbar-hide">
          {isLoading ? (
            // Show loading
            <div className="pl-4">
              {" "}
              {/* Add padding to loading state */}
              <div className="w-full min-w-[350px] max-w-lg h-[158px] rounded-[32px] bg-white/[0.06] animate-pulse flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white/20 border-t-white/80 rounded-full animate-spin" />
              </div>
            </div>
          ) : movies.length > 0 ? (
            // Show movies

            movies.map((movie, index) => (
              <div
                key={movie.id}
                className={`snap-start shrink-0 ${index === 0 ? "pl-2" : ""}`}
              >
                <MoviePreview movie={movie} />
              </div>
            ))
          ) : (
            // Show message if no movies
            <div className="flex items-center justify-center w-full min-h-[400px] text-foreground/70 pl-4">
              No movies found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
