export default function CardsLoading() {
  return (
    <div className="container-premium py-8">
      <div className="h-8 w-64 rounded-xl bg-[#0B1220] animate-pulse mb-6" />
      <div className="h-12 rounded-xl bg-[#0B1220] animate-pulse mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-[#0B1220] p-4 animate-pulse">
            <div className="aspect-[3/4] rounded-xl bg-[#050A12] mb-3" />
            <div className="h-4 rounded bg-[#050A12] mb-1" />
            <div className="h-3 w-3/4 rounded bg-[#050A12]" />
          </div>
        ))}
      </div>
    </div>
  );
}
