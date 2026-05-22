interface ChartItem {
  label: string;
  value: number;
  count: number;
}

interface Props {
  items: Array<{
    cardRarity?: string | null;
    cardSet?: string;
    quantity: number;
    marketValue?: number | null;
    purchasePrice?: number | null;
  }>;
  groupBy?: "rarity" | "set";
}

export default function CollectionChart({ items, groupBy = "rarity" }: Props) {
  const grouped = new Map<string, { value: number; count: number }>();

  for (const item of items) {
    const key = groupBy === "rarity"
      ? (item.cardRarity || "Neznámá rarita")
      : (item.cardSet || "Neznámá sada");
    const value = (item.marketValue ?? item.purchasePrice ?? 0) * item.quantity;
    const prev = grouped.get(key) || { value: 0, count: 0 };
    grouped.set(key, { value: prev.value + value, count: prev.count + item.quantity });
  }

  const data: ChartItem[] = Array.from(grouped.entries())
    .map(([label, { value, count }]) => ({ label, value, count }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-2.5">
      {data.map((item, i) => {
        const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        const hue = i % 2 === 0 ? "#00C8FF" : "#A7FF00";
        return (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-28 truncate text-right flex-shrink-0" title={item.label}>
              {item.label}
            </span>
            <div className="flex-1 bg-[#0B1220] rounded-full h-5 overflow-hidden">
              <div
                className="h-5 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{
                  width: `${Math.max(pct, 4)}%`,
                  background: `linear-gradient(90deg, ${hue}33, ${hue})`,
                }}
              >
                {pct > 25 && (
                  <span className="text-[10px] font-bold text-[#050A12]">
                    {item.count}×
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-300 w-20 text-right flex-shrink-0">
              {item.value.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč
            </span>
          </div>
        );
      })}
    </div>
  );
}
