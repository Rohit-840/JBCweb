import { createElement } from "react";
import { Activity, Banknote, CircleDollarSign, Landmark, Wallet } from "lucide-react";
import { GlassPanel, MetricValue } from "../../../components/ui/visual.jsx";
import { itemVariants } from "../../../components/ui/motion.js";

function fmt(value) {
  if (value === undefined || value === null) return "-";
  return `$${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const CARDS = [
  { key: "balance", label: "BALANCE", color: () => "text-white", icon: Landmark, tone: () => "neutral" },
  { key: "equity", label: "EQUITY", color: () => "text-green-400", icon: Wallet, tone: () => "positive" },
  {
    key: "profit",
    label: "PROFIT",
    color: (v) => v < 0 ? "text-red-400" : "text-green-400",
    icon: Activity,
    tone: (v) => v < 0 ? "negative" : "positive",
  },
  { key: "margin", label: "MARGIN", color: () => "text-yellow-400", icon: CircleDollarSign, tone: () => "gold" },
  { key: "free_margin", label: "FREE MARGIN", color: () => "text-yellow-400", icon: Banknote, tone: () => "gold" },
];

export default function StatsCards({ account }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
      {CARDS.map(({ key, label, color, icon: Icon, tone }) => {
        const value = account?.[key];
        const numericValue = Number(value) || 0;
        return (
          <GlassPanel
            key={key}
            variants={itemVariants}
            className="dashboard-stat-card p-4"
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-[10px] tracking-[0.2em] text-gray-500 uppercase">
                {label}
              </p>
              {createElement(Icon, { className: "h-4 w-4 text-yellow-400/45" })}
            </div>
            <p className={`text-lg font-bold ${color(numericValue)}`}>
              <MetricValue value={fmt(value)} tone={tone(numericValue)} />
            </p>
          </GlassPanel>
        );
      })}
    </div>
  );
}
