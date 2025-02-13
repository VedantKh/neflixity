import { GenreObject } from "@/types/movie";

interface GenreTagProps {
  genre: GenreObject;
}

const genreColors: {
  [key: string]: { bg: string; text: string; border: string };
} = {
  Action: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    border: "border-orange-500/20",
  },
  Adventure: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
  Animation: {
    bg: "bg-blue-400/20",
    text: "text-blue-300",
    border: "border-blue-400/20",
  },
  Comedy: {
    bg: "bg-yellow-400/20",
    text: "text-yellow-300",
    border: "border-yellow-400/20",
  },
  Crime: {
    bg: "bg-red-900/20",
    text: "text-red-700",
    border: "border-red-900/20",
  },
  Documentary: {
    bg: "bg-emerald-600/20",
    text: "text-emerald-400",
    border: "border-emerald-600/20",
  },
  Drama: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/20",
  },
  Family: {
    bg: "bg-green-400/20",
    text: "text-green-300",
    border: "border-green-400/20",
  },
  Fantasy: {
    bg: "bg-indigo-400/20",
    text: "text-indigo-300",
    border: "border-indigo-400/20",
  },
  Foreign: {
    bg: "bg-sky-500/20",
    text: "text-sky-400",
    border: "border-sky-500/20",
  },
  History: {
    bg: "bg-stone-500/20",
    text: "text-stone-400",
    border: "border-stone-500/20",
  },
  Horror: {
    bg: "bg-red-600/20",
    text: "text-red-500",
    border: "border-red-600/20",
  },
  Music: {
    bg: "bg-pink-400/20",
    text: "text-pink-300",
    border: "border-pink-400/20",
  },
  Mystery: {
    bg: "bg-violet-500/20",
    text: "text-violet-400",
    border: "border-violet-500/20",
  },
  Romance: {
    bg: "bg-rose-400/20",
    text: "text-rose-300",
    border: "border-rose-400/20",
  },
  "Science Fiction": {
    bg: "bg-cyan-500/20",
    text: "text-cyan-400",
    border: "border-cyan-500/20",
  },
  "TV Movie": {
    bg: "bg-slate-400/20",
    text: "text-slate-300",
    border: "border-slate-400/20",
  },
  Thriller: {
    bg: "bg-red-700/20",
    text: "text-red-600",
    border: "border-red-700/20",
  },
  War: {
    bg: "bg-zinc-600/20",
    text: "text-zinc-400",
    border: "border-zinc-600/20",
  },
  Western: {
    bg: "bg-brown-500/20",
    text: "text-amber-700",
    border: "border-amber-700/20",
  },
};

export default function GenreTag({ genre }: GenreTagProps) {
  const colors = genreColors[genre.name] || {
    bg: "bg-white/[0.06]",
    text: "text-white/70",
    border: "border-white/[0.06]",
  };

  return (
    <span
      className={`px-3.5 py-1.5 text-xs font-regular rounded-full ${colors.bg} ${colors.text} backdrop-blur-md border ${colors.border} shadow-sm tracking-wide`}
    >
      {genre.name}
    </span>
  );
}
