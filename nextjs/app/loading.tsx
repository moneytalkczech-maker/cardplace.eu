export default function Loading() {
  return (
    <div className="min-h-screen bg-[#050A12] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#00C8FF]/20 border-t-[#00C8FF] animate-spin" />
        <p className="text-sm text-gray-500 font-heading animate-pulse">Načítání...</p>
      </div>
    </div>
  );
}
