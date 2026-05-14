import { useEffect, useState } from "react";
import { Search, Filter } from "lucide-react";
import AuctionCard from "../components/AuctionCard";
import { auctions } from "../services/api";
import { useTranslation } from "../hooks/useTranslation";
import type { Auction } from "../types";

export default function Auctions() {
  const { t } = useTranslation();
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [status, setStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: any = {};
    if (search) params.search = search;
    if (sort !== "newest") params.sort = sort;
    if (status) params.status = status;

    auctions.getAll(params)
      .then(setAllAuctions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, sort, status]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-heading">{t("auctions.title")}</h1>
        <p className="text-gray-500 mt-1">Prohlížej, přihazuj a vyhrávej</p>
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
              <div className="aspect-[4/3] bg-[#111B2E]" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-[#111B2E] rounded w-3/4" />
                <div className="h-3 bg-[#111B2E] rounded w-1/2" />
                <div className="h-8 bg-[#111B2E] rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : allAuctions.length === 0 ? (
        <div className="text-center py-20">
          <Filter className="h-16 w-16 mx-auto mb-4 text-gray-600" />
          <p className="text-xl font-heading font-bold text-gray-400">{t("auctions.noResults")}</p>
          <p className="text-sm text-gray-600 mt-1">{t("auctions.noResultsHint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {allAuctions.map((a) => <AuctionCard key={a.id} auction={a} />)}
        </div>
      )}
    </div>
  );
}
