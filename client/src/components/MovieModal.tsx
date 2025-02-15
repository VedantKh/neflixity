import { MovieObject } from "@/types/movie";
import GenreTag from "./GenreTag";

interface MovieModalProps {
  movie: MovieObject;
  isOpen: boolean;
  onClose: () => void;
}

export default function MovieModal({
  movie,
  isOpen,
  onClose,
}: MovieModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Modal content */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 text-white/90 hover:text-white transition-all"
        >
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Movie content */}
        <div className="p-8 space-y-6">
          {/* Title and Release Year */}
          <div className="space-y-2">
            <h2 className="text-3xl font-regular text-white">{movie.title}</h2>
            {movie.tagline && (
              <p className="text-lg text-white/60 italic">{movie.tagline}</p>
            )}
            <p className="text-white/70 font-regular">
              {movie.release_date
                ? new Date(movie.release_date).getFullYear()
                : "N/A"}{" "}
              • {movie.original_language.toUpperCase()}
            </p>
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2">
            {movie.genres.map((genre) => (
              <GenreTag key={genre.id} genre={genre} />
            ))}
          </div>

          {/* Overview */}
          <p className="text-white/90 leading-relaxed font-regular">
            {movie.overview}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6 pt-4">
            {/* Rating */}
            <div className="space-y-1 text-center p-4 rounded-2xl bg-black/40 border border-white/10">
              <span className="text-yellow-400 text-xl md:text-2xl">★</span>
              <p className="text-white font-regular text-lg md:text-xl">
                {movie.vote_average.toFixed(1)}
              </p>
              <p className="text-white/70 text-xs md:text-sm uppercase tracking-wider font-regular">
                Rating
              </p>
            </div>

            {/* Vote Count */}
            <div className="space-y-1 text-center p-4 rounded-2xl bg-black/40 border border-white/10">
              <span className="text-blue-400 text-xl md:text-2xl">👥</span>
              <p className="text-white font-regular text-lg md:text-xl">
                {movie.vote_count.toLocaleString()}
              </p>
              <p className="text-white/70 text-xs md:text-sm uppercase tracking-wider font-regular">
                Votes
              </p>
            </div>

            {/* Popularity */}
            <div className="space-y-1 text-center p-4 rounded-2xl bg-black/40 border border-white/10">
              <span className="text-emerald-400 text-xl md:text-2xl">📈</span>
              <p className="text-white font-regular text-lg md:text-xl">
                {movie.popularity.toFixed(0)}
              </p>
              <p className="text-white/70 text-[10px] md:text-sm uppercase tracking-wider font-regular">
                Popularity
              </p>
            </div>
          </div>

          {/* IMDB Link */}
          {movie.imdb_id && (
            <div className="mt-6 text-center">
              <a
                href={`https://www.imdb.com/title/${movie.imdb_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-400 transition-colors duration-200"
              >
                <span className="font-medium">Watch trailer on IMDb</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    x="2"
                    y="2"
                    width="20"
                    height="20"
                    rx="2.18"
                    ry="2.18"
                  />
                  <line x1="7" y1="2" x2="7" y2="22" />
                  <line x1="17" y1="2" x2="17" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <line x1="2" y1="7" x2="7" y2="7" />
                  <line x1="2" y1="17" x2="7" y2="17" />
                  <line x1="17" y1="17" x2="22" y2="17" />
                  <line x1="17" y1="7" x2="22" y2="7" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
