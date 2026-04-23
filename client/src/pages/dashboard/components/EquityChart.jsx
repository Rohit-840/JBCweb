import { useRef, useEffect, useState } from "react";

function buildSVG({ pts, width, height, padL, padR, padT, padB }) {
  const chartW = Math.max(width - padL - padR, 10);
  const chartH = height - padT - padB;

  const values = pts.map((p) => p.equity);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const svgPts = pts.map((p, i) => ({
    x: padL + (i / (pts.length - 1)) * chartW,
    y: padT + (1 - (p.equity - minV) / range) * chartH,
  }));

  const pathD = svgPts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = svgPts[i - 1];
    const cpx = ((prev.x + p.x) / 2).toFixed(1);
    return `${acc} C ${cpx} ${prev.y.toFixed(1)} ${cpx} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, "");

  const last  = svgPts[svgPts.length - 1];
  const first = svgPts[0];
  const areaD = `${pathD} L ${last.x.toFixed(1)} ${(padT + chartH).toFixed(1)} L ${first.x.toFixed(1)} ${(padT + chartH).toFixed(1)} Z`;

  const yLabels = Array.from({ length: 5 }, (_, i) => ({
    y: padT + (1 - i / 4) * chartH,
    val: `$${(minV + (i / 4) * range).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
  }));

  return { chartW, chartH, svgPts, pathD, areaD, yLabels, minV, maxV, range };
}

export default function EquityChart({ equityHistory, strategyData, strategyName }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    const obs = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const isStrategy = !!strategyData && strategyData.length >= 2;
  const pts = isStrategy ? strategyData : (equityHistory || []);
  const hasData = pts.length >= 2;

  const height = 230;
  const padL = 12;
  const padR = 64;
  const padT = 16;
  const padB = 32;
  const chartW = Math.max(width - padL - padR, 10);
  const chartH = height - padT - padB;

  let pathD = "", areaD = "", yLabels = [], xLabels = [];

  if (hasData) {
    const built = buildSVG({ pts, width, height, padL, padR, padT, padB });
    pathD   = built.pathD;
    areaD   = built.areaD;
    yLabels = built.yLabels;

    const svgPts = built.svgPts;
    const lc = Math.min(6, pts.length);
    xLabels = Array.from({ length: lc }, (_, i) => {
      const idx = Math.floor((i / (lc - 1)) * (pts.length - 1));
      const t = new Date(pts[idx].time);
      const label = isStrategy
        ? `${t.getDate()}/${t.getMonth() + 1}`
        : `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}`;
      return { x: svgPts[idx].x, label };
    });
  }

  const lineColor  = isStrategy ? "#22c55e" : "#d4af37";
  const gradId     = isStrategy ? "stratGrad" : "eqGrad";
  const gradColor  = isStrategy ? "#22c55e"   : "#d4af37";
  const title      = isStrategy ? `${strategyName} P/L` : "Equity Curve";
  const badge      = isStrategy ? strategyName : "Real-Time";

  return (
    <div className="bg-[#111] rounded-xl p-4 border border-white/5 flex-1 min-w-0">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-yellow-400/70 uppercase">Performance</p>
          <p className="text-white font-semibold text-sm mt-0.5">{title}</p>
        </div>
        <span className={`text-[10px] tracking-widest uppercase px-2 py-1 rounded-lg
          ${isStrategy ? "bg-green-500/10 text-green-400" : "bg-white/5 text-gray-500"}`}>
          {badge}
        </span>
      </div>

      <div ref={containerRef} className="w-full">
        <svg width={width} height={height} style={{ display: "block" }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={gradColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={gradColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {Array.from({ length: 5 }).map((_, i) => (
            <line key={i}
              x1={padL} y1={padT + (i / 4) * chartH}
              x2={padL + chartW} y2={padT + (i / 4) * chartH}
              stroke="#1c1c1c" strokeWidth="1"
            />
          ))}

          {hasData ? (
            <>
              <path d={areaD} fill={`url(#${gradId})`} />
              <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />

              {yLabels.map((l, i) => (
                <text key={i} x={padL + chartW + 6} y={l.y + 4}
                  fill="#4a4a4a" fontSize="9" fontFamily="monospace">
                  {l.val}
                </text>
              ))}
              {xLabels.map((l, i) => (
                <text key={i} x={l.x} y={height - 4}
                  fill="#4a4a4a" fontSize="9" textAnchor="middle" fontFamily="monospace">
                  {l.label}
                </text>
              ))}
            </>
          ) : (
            <text x={padL + chartW / 2} y={padT + chartH / 2}
              fill="#2a2a2a" fontSize="12" textAnchor="middle" dominantBaseline="middle">
              {isStrategy ? "No strategy trade data" : "Waiting for live data..."}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
