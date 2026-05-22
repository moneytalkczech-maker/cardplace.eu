interface ChartItem {
  label: string;
  value: number;
  count: number;
}

interface Snapshot {
  createdAt: string;
  totalValue: number;
  totalCards: number;
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
  snapshots?: Snapshot[];
  view?: "breakdown" | "history";
}

function BreakdownChart({
  items,
  groupBy,
}: {
  items: Props["items"];
  groupBy: "rarity" | "set";
}) {
  const grouped = new Map<string, { value: number; count: number }>();

  for (const item of items) {
    const key =
      groupBy === "rarity"
        ? item.cardRarity || "Neznámá rarita"
        : item.cardSet || "Neznámá sada";
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
            <span
              className="text-xs text-gray-400 w-28 truncate text-right flex-shrink-0"
              title={item.label}
            >
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

function HistoryChart({ snapshots }: { snapshots: Snapshot[] }) {
  if (snapshots.length < 2) {
    return (
      <p className="text-xs text-gray-500 text-center py-4">
        Přidej více karet pro zobrazení vývoje hodnoty
      </p>
    );
  }

  const W = 600;
  const H = 120;
  const PAD = { top: 10, right: 16, bottom: 28, left: 56 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const values = snapshots.map((s) => s.totalValue);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const pts = snapshots.map((s, i) => {
    const x = PAD.left + (i / (snapshots.length - 1)) * innerW;
    const y = PAD.top + (1 - (s.totalValue - minV) / range) * innerH;
    return { x, y, s };
  });

  const pathD = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaD =
    pathD +
    ` L ${pts[pts.length - 1].x.toFixed(1)} ${(PAD.top + innerH).toFixed(1)}` +
    ` L ${pts[0].x.toFixed(1)} ${(PAD.top + innerH).toFixed(1)} Z`;

  // Y-axis labels (3 ticks)
  const yTicks = [minV, minV + range / 2, maxV];

  // X-axis labels (first, middle, last)
  const xDates = [
    snapshots[0],
    snapshots[Math.floor(snapshots.length / 2)],
    snapshots[snapshots.length - 1],
  ];

  const fmt = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "short" });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: 120 }}
      aria-hidden
    >
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00C8FF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#00C8FF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path d={areaD} fill="url(#chartGrad)" />

      {/* Grid lines */}
      {yTicks.map((v, i) => {
        const y = PAD.top + (1 - (v - minV) / range) * innerH;
        return (
          <g key={i}>
            <line
              x1={PAD.left}
              y1={y}
              x2={PAD.left + innerW}
              y2={y}
              stroke="rgba(0,200,255,0.08)"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 4}
              y={y + 4}
              textAnchor="end"
              fontSize="9"
              fill="rgba(255,255,255,0.35)"
            >
              {v >= 1000
                ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`
                : v.toFixed(0)}
            </text>
          </g>
        );
      })}

      {/* X-axis date labels */}
      {xDates.map((s, i) => {
        const idx = snapshots.indexOf(s);
        const x = PAD.left + (idx / (snapshots.length - 1)) * innerW;
        const anchor = i === 0 ? "start" : i === 2 ? "end" : "middle";
        return (
          <text
            key={i}
            x={x}
            y={H - 4}
            textAnchor={anchor}
            fontSize="9"
            fill="rgba(255,255,255,0.35)"
          >
            {fmt.format(new Date(s.createdAt))}
          </text>
        );
      })}

      {/* Line */}
      <path d={pathD} fill="none" stroke="#00C8FF" strokeWidth="2" strokeLinejoin="round" />

      {/* Last point dot */}
      {pts.length > 0 && (
        <circle
          cx={pts[pts.length - 1].x}
          cy={pts[pts.length - 1].y}
          r="3.5"
          fill="#00C8FF"
        />
      )}
    </svg>
  );
}

export default function CollectionChart({
  items,
  groupBy = "rarity",
  snapshots,
  view = "breakdown",
}: Props) {
  if (view === "history" && snapshots) {
    return <HistoryChart snapshots={snapshots} />;
  }
  return <BreakdownChart items={items} groupBy={groupBy} />;
}
