export default function AuctionsLoading() {
  return (
    <div className="container-premium py-8">
      <div className="h-8 w-48 rounded-xl bg-[#0B1220] animate-pulse mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="aspect-square rounded-xl bg-[#0B1220] mb-3" />
            <div className="h-4 rounded bg-[#0B1220] mb-2" />
            <div className="h-3 w-2/3 rounded bg-[#0B1220] mb-3" />
            <div className="h-8 rounded-lg bg-[#0B1220]" />
          </div>
        ))}
      </div>
    </div>
  );
}
