export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#050A12] flex">
      <div className="w-60 flex-shrink-0 border-r border-[rgba(0,200,255,0.08)] bg-[#050A12]" />
      <div className="flex-1 p-8">
        <div className="h-8 w-56 rounded-xl bg-[#0B1220] animate-pulse mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-[#0B1220] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
