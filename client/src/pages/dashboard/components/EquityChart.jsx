import { useRef, useEffect, useState } from "react";

export default function EquityChart({ equityHistory }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    const obs = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const height = 230;
  const padL = 12;
  const padR = 64;
  const padT = 16;
  const padB = 32;
  const chartW = Math.max(width - padL - padR, 10);
  const chartH = height - padT - padB;

  const hasData = equityHistory && equityHistory.length >= 2;

  let pathD = "";
  let areaD = "";
  let yLabels = [];
  let xLabels = [];

  if (hasData) {
    const equities = equityHistory.map((p) => p.equity);
    const minEq = Math.min(...equities);
    const maxEq = Math.max(...equities);
    const range = maxEq - minEq || 1;

    const pts = equityHistory.map((p, i) => ({
      x: padL + (i / (equityHistory.length - 1)) * chartW,
      y: padT + (1 - (p.equity - minEq) / range) * chartH,
    }));

    pathD = pts.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      const prev = pts[i - 1];
      const cpx = ((prev.x + p.x) / 2).toFixed(1);
      return `${acc} C ${cpx} ${prev.y.toFixed(1)} ${cpx} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }, "");

    const last = pts[pts.length - 1];
    const first = pts[0];
    areaD = `${pathD} L ${last.x.toFixed(1)} ${(padT + chartH).toFixed(1)} L ${first.x.toFixed(1)} ${(padT + chartH).toFixed(1)} Z`;

    yLabels = Array.from({ length: 5 }, (_, i) => ({
      y: padT + (1 - i / 4) * chartH,
      val: `$${(minEq + (i / 4) * range).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
    }));

    const labelCount = Math.min(6, equityHistory.length);
    xLabels = Array.from({ length: labelCount }, (_, i) => {
      const idx = Math.floor((i / (labelCount - 1)) * (equityHistory.length - 1));
      const t = new Date(equityHistory[idx].time);
      return {
        x: pts[idx].x,
        label: `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}`,
      };
    });
  }

  return (
    <div className="bg-[#111] rounded-xl p-4 border border-white/5 flex-1 min-w-0">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-yellow-400/70 uppercase">
            Performance
          </p>
          <p className="text-white font-semibold text-sm mt-0.5">Equity Curve</p>
        </div>
        <span className="text-[10px] tracking-widest text-gray-500 uppercase bg-white/5 px-2 py-1 rounded-lg">
          Real-Time
        </span>
      </div>

      <div ref={containerRef} className="w-full">
        <svg width={width} height={height} style={{ display: "block" }}>
          <defs>
            <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {Array.from({ length: 5 }).map((_, i) => (
            <line
              key={i}
              x1={padL}
              y1={padT + (i / 4) * chartH}
              x2={padL + chartW}
              y2={padT + (i / 4) * chartH}
              stroke="#1c1c1c"
              strokeWidth="1"
            />
          ))}

          {hasData ? (
            <>
              <path d={areaD} fill="url(#eqGrad)" />
              <path
                d={pathD}
                fill="none"
                stroke="#d4af37"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {yLabels.map((l, i) => (
                <text
                  key={i}
                  x={padL + chartW + 6}
                  y={l.y + 4}
                  fill="#4a4a4a"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {l.val}
                </text>
              ))}

              {xLabels.map((l, i) => (
                <text
                  key={i}
                  x={l.x}
                  y={height - 4}
                  fill="#4a4a4a"
                  fontSize="9"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {l.label}
                </text>
              ))}
            </>
          ) : (
            <text
              x={padL + chartW / 2}
              y={padT + chartH / 2}
              fill="#2a2a2a"
              fontSize="12"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              Waiting for live data...
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
