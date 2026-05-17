import { ChevronDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface PaginationProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  total?: number;
  currentCount?: number;
}

export default function Pagination({ hasMore, loading, onLoadMore, total, currentCount }: PaginationProps) {
  if (!hasMore && !total) return null;

  return (
    <div className="flex flex-col items-center gap-4 mt-10">
      {currentCount !== undefined && total !== undefined && (
        <p className="text-xs text-gray-500">
          Zobrazeno {currentCount} z {total} výsledků
        </p>
      )}
      
      {hasMore ? (
        <button
          onClick={onLoadMore}
          disabled={loading}
          className="group flex items-center gap-3 px-8 py-4 rounded-2xl border border-[rgba(0,200,255,0.2)] text-[#00C8FF] font-bold font-heading hover:bg-[rgba(0,200,255,0.08)] hover:border-[rgba(0,200,255,0.4)] transition-all duration-300 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
          {loading ? "Načítání..." : "Načíst další"}
        </button>
      ) : currentCount !== undefined && currentCount > 0 ? (
        <p className="text-xs text-gray-500">Konec seznamu</p>
      ) : null}
    </div>
  );
}
