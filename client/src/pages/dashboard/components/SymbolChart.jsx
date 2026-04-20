import { useRef, useEffect, useState } from "react";

function buildPoints(history) {
  if (!history || history.length === 0) return [];
  const sorted = [...history].sort((a, b) => a.time - b.time);
  let cum = 0;
  return sorted.map((d) => ({ time: d.time, value: (cum += d.profit) }));
}

export default function SymbolChart({ history, height = 260 }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(400);

  useEffect(() => {
    const obs = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const padL = 8;
  const padR = 52;
  const padT = 12;
  const padB = 28;
  const chartW = Math.max(width - padL - padR, 10);
  const chartH = height - padT - padB;

  const pts = buildPoints(history);
  const hasData = pts.length >= 2;

  let pathD = "";
  let areaPos = "";
  let areaNeg = "";
  let yLabels = [];
  let xLabels = [];

  if (hasData) {
    const values = pts.map((p) => p.value);
    const minV = Math.min(0, ...values);
    const maxV = Math.max(0, ...values);
    const range = maxV - minV || 1;

    const toX = (i) => padL + (i / (pts.length - 1)) * chartW;
    const toY = (v) => padT + (1 - (v - minV) / range) * chartH;
    const zeroY = toY(0);

    const svgPts = pts.map((p, i) => ({ x: toX(i), y: toY(p.value) }));

    pathD = svgPts.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      const prev = svgPts[i - 1];
      const cpx = ((prev.x + p.x) / 2).toFixed(1);
      return `${acc} C ${cpx} ${prev.y.toFixed(1)} ${cpx} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }, "");

    const first = svgPts[0];
    const last = svgPts[svgPts.length - 1];
    areaPos = `${pathD} L ${last.x.toFixed(1)} ${zeroY.toFixed(1)} L ${first.x.toFixed(1)} ${zeroY.toFixed(1)} Z`;
    areaNeg = areaPos;

    // Y labels (5 levels)
    yLabels = Array.from({ length: 5 }, (_, i) => {
      const frac = i / 4;
      return {
        y: padT + (1 - frac) * chartH,
        val: `$${(minV + frac * range).toFixed(0)}`,
        pos: minV + frac * range >= 0,
      };
    });

    // X labels (up to 5 dates)
    const lc = Math.min(5, pts.length);
    xLabels = Array.from({ length: lc }, (_, i) => {
      const idx = Math.floor((i / (lc - 1)) * (pts.length - 1));
      const d = new Date(pts[idx].time * 1000);
      return {
        x: svgPts[idx].x,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
      };
    });
  }

  return (
    <div ref={containerRef} className="w-full">
      <svg width={width} height={height} style={{ display: "block" }}>
        <defs>
          <linearGradient id="symPos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="symNeg" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {Array.from({ length: 5 }).map((_, i) => (
          <line
            key={i}
            x1={padL} y1={padT + (i / 4) * chartH}
            x2={padL + chartW} y2={padT + (i / 4) * chartH}
            stroke="#1c1c1c" strokeWidth="1"
          />
        ))}

        {hasData ? (
          <>
            <path d={areaPos} fill="url(#symPos)" />
            <path d={pathD} fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />

            {/* Zero reference line */}
            {yLabels.some((l) => !l.pos) && yLabels.some((l) => l.pos) && (
              <line
                x1={padL} x2={padL + chartW}
                y1={padT + (1 - (0 - Math.min(0, ...buildPoints(history).map(p => p.value))) / (Math.max(0, ...buildPoints(history).map(p => p.value)) - Math.min(0, ...buildPoints(history).map(p => p.value)) || 1)) * chartH}
                y2={padT + (1 - (0 - Math.min(0, ...buildPoints(history).map(p => p.value))) / (Math.max(0, ...buildPoints(history).map(p => p.value)) - Math.min(0, ...buildPoints(history).map(p => p.value)) || 1)) * chartH}
                stroke="#333" strokeWidth="1" strokeDasharray="3,3"
              />
            )}

            {yLabels.map((l, i) => (
              <text key={i} x={padL + chartW + 4} y={l.y + 4}
                fill={l.pos ? "#4a4a4a" : "#4a4a4a"} fontSize="9" fontFamily="monospace">
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
            fill="#2a2a2a" fontSize="11" textAnchor="middle" dominantBaseline="middle">
            No history data
          </text>
        )}
      </svg>
    </div>
  );
}
