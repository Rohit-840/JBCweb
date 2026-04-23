function fmt(value) {
  if (value === undefined || value === null) return "—";
  return `$${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const CARDS = [
  { key: "balance",     label: "BALANCE",     color: () => "text-white" },
  { key: "equity",      label: "EQUITY",      color: () => "text-green-400" },
  { key: "profit",      label: "PROFIT",      color: (v) => v < 0 ? "text-red-400" : "text-green-400" },
  { key: "margin",      label: "MARGIN",      color: () => "text-yellow-400" },
  { key: "free_margin", label: "FREE MARGIN", color: () => "text-yellow-400" },
];

export default function StatsCards({ account }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
      {CARDS.map(({ key, label, color }) => {
        const value = account?.[key];
        return (
          <div key={key} className="bg-[#111] rounded-xl p-4 border border-white/5">
            <p className="text-[10px] tracking-[0.15em] text-gray-500 uppercase mb-2">
              {label}
            </p>
            <p className={`text-lg font-semibold ${color(Number(value) || 0)}`}>
              {fmt(value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
