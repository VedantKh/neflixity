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
          <div className="grid grid-cols-3 gap-6 pt-4">
            {/* Rating */}
            <div className="space-y-1 text-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <span className="text-yellow-400 text-2xl">★</span>
              <p className="text-white font-regular text-xl">
                {movie.vote_average.toFixed(1)}
              </p>
              <p className="text-white/70 text-sm uppercase tracking-wider font-regular">
                Rating
              </p>
            </div>

            {/* Vote Count */}
            <div className="space-y-1 text-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <span className="text-blue-400 text-2xl">👥</span>
              <p className="text-white font-regular text-xl">
                {movie.vote_count.toLocaleString()}
              </p>
              <p className="text-white/70 text-sm uppercase tracking-wider font-regular">
                Votes
              </p>
            </div>

            {/* Popularity */}
            <div className="space-y-1 text-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <span className="text-emerald-400 text-2xl">📈</span>
              <p className="text-white font-regular text-xl">
                {movie.popularity.toFixed(0)}
              </p>
              <p className="text-white/70 text-sm uppercase tracking-wider font-regular">
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
                <span className="font-medium">View on IMDb</span>
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
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
