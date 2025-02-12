export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
      <span className="text-white/80 text-sm">Searching movies...</span>
    </div>
  );
}
