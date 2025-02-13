import { MovieObject } from "@/types/movie";

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
            <p className="text-white/70 font-regular">
              {new Date(movie.release_date).getFullYear()} •{" "}
              {movie.original_language.toUpperCase()}
            </p>
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2">
            {movie.genres.map((genre) => (
              <span
                key={genre.id}
                className="px-3.5 py-1.5 text-sm font-regular rounded-full bg-white/10 backdrop-blur-md text-white/90 border border-white/10"
              >
                {genre.name}
              </span>
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
        </div>
      </div>
    </div>
  );
}
