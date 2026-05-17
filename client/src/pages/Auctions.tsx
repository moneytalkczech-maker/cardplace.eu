import { useEffect, useState, useRef } from "react";
import { Search, Filter, Bolt } from "lucide-react";
import AuctionCard from "../components/AuctionCard";
import Pagination from "../components/Pagination";
import { auctions } from "../services/api";
import { useTranslation } from "../hooks/useTranslation";
import { toast } from "../components/Toast";
import type { Auction } from "../types";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function Auctions() {
  const { t } = useTranslation();
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState("newest");
  const [status, setStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reset při změně filtrů
  useEffect(() => {
    setAllAuctions([]);
    setCursor(null);
    setNextCursor(null);
  }, [debouncedSearch, sort, status]);

  // Načtení dat
  useEffect(() => {
    setLoading(true);
    const params: Record<string, any> = { take: 20 };
    if (debouncedSearch) params.search = debouncedSearch;
    if (sort !== "newest") params.sort = sort;
    if (status) params.status = status;
    if (cursor) params.cursor = cursor;

    auctions.getAll(params)
      .then((response: any) => {
        // API vrací { data: [...], nextCursor: "..." }
        const items = Array.isArray(response) ? response : response.data || [];
        const next = response.nextCursor || null;
        setAllAuctions(items);
        setNextCursor(next);
      })
      .catch(() => toast("error", t("auctions.loadError")))
      .finally(() => setLoading(false));
  }, [debouncedSearch, sort, status, cursor]);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const params: Record<string, any> = { take: 20, cursor: nextCursor };
    if (debouncedSearch) params.search = debouncedSearch;
    if (sort !== "newest") params.sort = sort;
    if (status) params.status = status;

    try {
      const response: any = await auctions.getAll(params);
      const items = Array.isArray(response) ? response : response.data || [];
      setAllAuctions((prev) => [...prev, ...items]);
      setNextCursor(response.nextCursor || null);
    } catch {
      toast("error", t("auctions.loadError"));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C8FF] to-[#009DFF] flex items-center justify-center shadow-lg shadow-[rgba(0,200,255,0.3)]">
            <Bolt className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-4xl font-bold font-heading">
            <span className="text-white">Aukční </span>
            <span className="text-gradient">síň</span>
          </h1>
        </div>
        <p className="text-gray-500 mt-1 ml-[52px]">{t("auctions.subtitle")}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:flex-none min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder={t("auctions.search")}
              className="input pl-10 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input w-auto min-w-[130px]" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">{t("auctions.newest")}</option>
            <option value="ending">{t("auctions.ending")}</option>
            <option value="price-asc">{t("auctions.priceLow")}</option>
            <option value="price-desc">{t("auctions.priceHigh")}</option>
          </select>
          <select className="input w-auto min-w-[100px]" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ACTIVE">{t("auctions.active")}</option>
            <option value="ENDED">{t("auctions.ended")}</option>
            <option value="">{t("auctions.all")}</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse p-0 overflow-hidden">
              <div className="aspect-[4/3] bg-[#0B1220]" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-[#0B1220] rounded w-3/4" />
                <div className="h-3 bg-[#0B1220] rounded w-1/2" />
                <div className="h-8 bg-[#0B1220] rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : allAuctions.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-[rgba(255,0,68,0.1)] border border-[rgba(255,0,68,0.2)] flex items-center justify-center mx-auto mb-4">
            <Filter className="h-8 w-8 text-[#FF3366]" />
          </div>
          <p className="text-xl font-heading font-bold text-gray-400">{t("auctions.noResults")}</p>
          <p className="text-sm text-gray-600 mt-1">{t("auctions.noResultsHint")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {allAuctions.map((a) => <AuctionCard key={a.id} auction={a} />)}
          </div>
          {/* Pagination */}
          {(nextCursor || allAuctions.length > 0) && (
            <Pagination
              hasMore={!!nextCursor}
              loading={loadingMore}
              onLoadMore={handleLoadMore}
              currentCount={allAuctions.length}
            />
          )}
        </>
      )}
    </div>
  );
}
