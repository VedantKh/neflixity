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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Modal content */}
      <div className="bg-[#1A1A1A]/95 rounded-3xl border border-white/[0.08] shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close button - moved inside modal content and adjusted positioning */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 text-white/90 hover:bg-black/40 hover:text-white transition-all"
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
            <h2 className="text-3xl font-bold text-white/90 tracking-tight">
              {movie.title}
            </h2>
            <p className="text-white/50">
              {new Date(movie.release_date).getFullYear()} •{" "}
              {movie.original_language.toUpperCase()}
            </p>
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2">
            {movie.genres.map((genre) => (
              <span
                key={genre.id}
                className="px-3.5 py-1.5 text-sm font-medium rounded-full bg-white/[0.06] text-white/70 backdrop-blur-md border border-white/[0.06]"
              >
                {genre.name}
              </span>
            ))}
          </div>

          {/* Overview */}
          <p className="text-white/80 leading-relaxed">{movie.overview}</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-6 pt-4">
            {/* Rating */}
            <div className="space-y-1 text-center">
              <span className="text-yellow-400 text-2xl">★</span>
              <p className="text-white/90 font-medium text-xl">
                {movie.vote_average.toFixed(1)}
              </p>
              <p className="text-white/50 text-sm uppercase tracking-wider">
                Rating
              </p>
            </div>

            {/* Vote Count */}
            <div className="space-y-1 text-center">
              <span className="text-blue-400 text-2xl">👥</span>
              <p className="text-white/90 font-medium text-xl">
                {movie.vote_count.toLocaleString()}
              </p>
              <p className="text-white/50 text-sm uppercase tracking-wider">
                Votes
              </p>
            </div>

            {/* Popularity */}
            <div className="space-y-1 text-center">
              <span className="text-emerald-400 text-2xl">📈</span>
              <p className="text-white/90 font-medium text-xl">
                {movie.popularity.toFixed(0)}
              </p>
              <p className="text-white/50 text-sm uppercase tracking-wider">
                Popularity
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
