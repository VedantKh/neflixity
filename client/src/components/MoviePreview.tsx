import { MovieObject } from "@/types/movie";
import { useState } from "react";
import MovieModal from "./MovieModal";
import GenreTag from "./GenreTag";

interface MoviePreviewProps {
  movie: MovieObject;
}

export default function MoviePreview({ movie }: MoviePreviewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="group relative w-full min-w-[350px] max-w-lg rounded-[32px] overflow-visible hover:scale-[1.02] transition-all duration-300 mx-auto cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Glass background */}
        <div className="absolute inset-1 bg-[#1A1A1A]/40 backdrop-blur-xl rounded-[32px] shadow-xl" />

        {/* Hover overlay mask */}
        <div className="absolute inset-1 bg-black/80 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 flex items-center justify-center gap-12 rounded-[32px]">
          {/* Rating */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-yellow-400 text-3xl mb-0.5">★</span>
            <span className="text-white/90 font-medium text-xl tracking-tight">
              {movie.vote_average.toFixed(1)}
            </span>
            <span className="text-white/50 text-[10px] font-medium uppercase tracking-wider">
              Rating
            </span>
          </div>

          {/* Vote Count */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-blue-400 text-3xl mb-0.5">👥</span>
            <span className="text-white/90 font-medium text-xl tracking-tight">
              {movie.vote_count.toLocaleString()}
            </span>
            <span className="text-white/50 text-[10px] font-medium uppercase tracking-wider">
              Votes
            </span>
          </div>

          {/* Popularity */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-emerald-400 text-3xl mb-0.5">📈</span>
            <span className="text-white/90 font-medium text-xl tracking-tight">
              {movie.popularity.toFixed(0)}
            </span>
            <span className="text-white/50 text-[10px] font-medium uppercase tracking-wider">
              Popularity
            </span>
          </div>
        </div>

        <div className="relative p-6 m-1 flex flex-col gap-5 items-center text-center">
          {/* Movie info */}
          <div className="space-y-4 w-full flex flex-col items-center">
            <h2 className="text-xl font-regular text-white/90 line-clamp-2 w-full">
              {movie.title}
            </h2>

            {/* <p className="text-sm text-foreground/90 line-clamp-3">
              {movie.overview}
            </p> */}

            {/* Genres */}
            <div className="flex flex-wrap gap-2 justify-center">
              {movie.genres.map((genre) => (
                <GenreTag key={genre.id} genre={genre} />
              ))}
            </div>

            {/* Release date and other details */}
            <div className="flex items-center gap-4 text-sm text-white/50 font-medium tracking-wide">
              <span>
                {movie.release_date
                  ? new Date(movie.release_date).getFullYear()
                  : "N/A"}
              </span>
              <span className="text-white/30">•</span>
              <span>{movie.original_language.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      <MovieModal
        movie={movie}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
