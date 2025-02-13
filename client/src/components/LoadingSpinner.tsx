export default function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 mt-12">
      <div className="flex items-center justify-center gap-2">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
        <span className="text-white/80 text-sm">
          {message && (
            <span className="text-white/60 text-sm text-center">{message}</span>
          )}
        </span>
      </div>
    </div>
  );
}
