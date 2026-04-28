import { useRef, useEffect, useState } from "react";

function buildHistPts(history) {
  if (!history || history.length === 0) return [];
  const sorted = [...history].sort((a, b) => a.time - b.time);
  let cum = 0;
  return sorted.map((d) => ({ time: d.time, value: (cum += d.profit) }));
}

function pnlFmt(v) {
  return `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
}

function smoothPath(pts) {
  return pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    if (p.x <= prev.x) return `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const cpx  = ((prev.x + p.x) / 2).toFixed(1);
    return `${acc} C ${cpx} ${prev.y.toFixed(1)} ${cpx} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, "");
}

function fmtDate(unixSec) {
  const d = new Date(unixSec * 1000);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth() + 1).padStart(2,"0")}`;
}

export default function SymbolChart({ history, trades = [], height = 260 }) {
  const wrapRef = useRef(null);
  const svgRef  = useRef(null);
  const [width, setWidth] = useState(400);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const obs = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    if (wrapRef.current) obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  // Generous padding so labels are never clipped
  const padL = 52;   // Y-axis labels on LEFT
  const padR = 12;
  const padT = 18;
  const padB = 34;   // X-axis labels on BOTTOM
  const chartW = Math.max(width - padL - padR, 10);
  const chartH = height - padT - padB;

  // ── History cumulative P&L ─────────────────────────────────────────────────
  const histPts = buildHistPts(history);
  const hasHist = histPts.length >= 2;

  // ── Open positions stepped projection ─────────────────────────────────────
  const localNow      = Math.floor(Date.now() / 1000);
  const lastHistValue = histPts.length > 0 ? histPts[histPts.length - 1].value : 0;
  const lastHistTime  = histPts.length > 0 ? histPts[histPts.length - 1].time  : localNow - 3600;
  const totalOpenPnl  = trades.reduce((s, t) => s + (t.profit || 0), 0);
  const hasOpen       = trades.length > 0;

  const sortedTrades = hasOpen ? [...trades].sort((a, b) => a.time - b.time) : [];
  let openPts = [];
  if (hasOpen) {
    let cum = lastHistValue;
    openPts = [{ time: lastHistTime, value: cum }];
    for (const t of sortedTrades) {
      const tTime = Math.max(t.time, lastHistTime);
      if (openPts[openPts.length - 1].time < tTime)
        openPts.push({ time: tTime, value: cum });
      cum += t.profit || 0;
      openPts.push({ time: tTime, value: cum });
    }
    // MT5 server clock may be ahead of local clock — use whichever is later
    // so the dashed projection line always extends to the right, never left.
    const lastOpenTime = openPts[openPts.length - 1].time;
    const now = Math.max(localNow, lastOpenTime + 1);
    if (lastOpenTime < now)
      openPts.push({ time: now, value: cum });
  }

  // ── Combined scale — always include 0 in the value range ──────────────────
  const allVals = [0, ...histPts.map(p => p.value), ...openPts.map(p => p.value)];
  const allTs   = [...histPts.map(p => p.time), ...(hasOpen ? [now] : [])];
  const rawMinV = Math.min(...allVals);
  const rawMaxV = Math.max(...allVals);
  // Add 10 % vertical breathing room so lines don't touch the chart edges
  const vPad = (rawMaxV - rawMinV || 1) * 0.1;
  const minV  = rawMinV - vPad;
  const maxV  = rawMaxV + vPad;
  const range = maxV - minV || 1;
  const minT  = allTs.length ? Math.min(...allTs) : 0;
  const maxT  = allTs.length ? Math.max(...allTs) : 1;
  const tSpan = maxT - minT || 1;

  const toX  = (t) => padL + ((t - minT) / tSpan) * chartW;
  const toY  = (v) => padT + (1 - (v - minV) / range) * chartH;
  const zeroY = toY(0);

  // ── SVG paths ──────────────────────────────────────────────────────────────
  let histPathD = "", histAreaD = "";
  if (hasHist) {
    const svgPts = histPts.map(p => ({ x: toX(p.time), y: toY(p.value) }));
    histPathD = smoothPath(svgPts);
    const f = svgPts[0], l = svgPts[svgPts.length - 1];
    histAreaD = `${histPathD} L ${l.x.toFixed(1)} ${zeroY.toFixed(1)} L ${f.x.toFixed(1)} ${zeroY.toFixed(1)} Z`;
  }

  const openPathD = openPts.length >= 2
    ? openPts.map((p, i) =>
        `${i === 0 ? "M" : "L"} ${toX(p.time).toFixed(1)} ${toY(p.value).toFixed(1)}`
      ).join(" ")
    : "";

  // ── Y-axis labels — 5 evenly-spaced ticks ─────────────────────────────────
  const yTicks = (hasHist || hasOpen)
    ? Array.from({ length: 5 }, (_, i) => {
        const frac = i / 4;
        const v    = minV + frac * range;
        return { y: padT + (1 - frac) * chartH, val: `$${v.toFixed(0)}`, pos: v >= 0 };
      })
    : [];

  // ── X-axis labels — up to 5 evenly-spaced dates ───────────────────────────
  const xTicks = allTs.length >= 2
    ? Array.from({ length: Math.min(5, allTs.length) }, (_, i) => {
        const sorted = [...allTs].sort((a, b) => a - b);
        const idx    = Math.floor((i / (Math.min(5, sorted.length) - 1)) * (sorted.length - 1));
        return sorted[idx];
      }).filter((v, i, arr) => arr.indexOf(v) === i)   // dedupe
    : [];

  // ── Mouse interaction ──────────────────────────────────────────────────────
  const onMouseMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const mx     = e.clientX - svg.getBoundingClientRect().left;
    const mouseT = minT + ((mx - padL) / chartW) * tSpan;

    let histVal = null;
    if (histPts.length > 0) {
      let best = histPts[0];
      for (const p of histPts)
        if (Math.abs(p.time - mouseT) < Math.abs(best.time - mouseT)) best = p;
      histVal = best.value;
    }

    let openVal = null;
    if (openPts.length >= 2) {
      for (let i = 1; i < openPts.length; i++) {
        if (mouseT <= openPts[i].time) {
          const a = openPts[i - 1], b = openPts[i];
          const f = (mouseT - a.time) / (b.time - a.time || 1);
          openVal = a.value + f * (b.value - a.value);
          break;
        }
      }
      if (openVal === null) openVal = openPts[openPts.length - 1].value;
    }

    setHover({ x: mx, histVal, openVal });
  };

  return (
    <div ref={wrapRef} className="w-full">

      {/* ── Legend ── */}
      {(hasHist || hasOpen) && (
        <div className="flex items-center gap-5 px-1 mb-2.5">
          {hasHist && (
            <div className="flex items-center gap-2">
              <svg width="22" height="8">
                <line x1="0" y1="4" x2="22" y2="4"
                  stroke="#22c55e" strokeWidth="2" />
              </svg>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide">Closed P&L</span>
            </div>
          )}
          {hasOpen && (
            <div className="flex items-center gap-2">
              <svg width="22" height="8">
                <line x1="0" y1="4" x2="22" y2="4"
                  stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="5,3" />
              </svg>
              <span className="text-[10px] text-amber-400 font-semibold tracking-wide">
                Open {pnlFmt(totalOpenPnl)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── SVG ── */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ display: "block", cursor: hasHist || hasOpen ? "crosshair" : "default" }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="scHistGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#22c55e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="scOpenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#f59e0b" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* ── Axis borders ── */}
        {/* Left Y-axis */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + chartH}
          stroke="#2e2e2e" strokeWidth="1" />
        {/* Bottom X-axis */}
        <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH}
          stroke="#2e2e2e" strokeWidth="1" />

        {/* ── Horizontal grid lines (aligned to Y ticks) ── */}
        {yTicks.map((tick, i) => (
          <line key={i}
            x1={padL} y1={tick.y} x2={padL + chartW} y2={tick.y}
            stroke="#242424" strokeWidth="1"
          />
        ))}

        {/* ── Y-axis tick labels (left side) ── */}
        {yTicks.map((tick, i) => (
          <text key={i}
            x={padL - 6} y={tick.y + 4}
            fill={tick.pos ? "#6b7280" : "#9ca3af"}
            fontSize="10" fontFamily="monospace" textAnchor="end">
            {tick.val}
          </text>
        ))}

        {(hasHist || hasOpen) ? (
          <>
            {/* History gradient fill */}
            {hasHist && histAreaD && (
              <path d={histAreaD} fill="url(#scHistGrad)" />
            )}

            {/* History line — bright green, 2 px */}
            {hasHist && (
              <path d={histPathD} fill="none"
                stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Open positions amber fill */}
            {openPathD && hasOpen && (() => {
              const last = openPts[openPts.length - 1];
              const first = openPts[0];
              const areaD = `${openPathD} L ${toX(last.time).toFixed(1)} ${zeroY.toFixed(1)} L ${toX(first.time).toFixed(1)} ${zeroY.toFixed(1)} Z`;
              return <path d={areaD} fill="url(#scOpenGrad)" />;
            })()}

            {/* Open positions dashed amber line — 2.5 px, brighter dashes */}
            {openPathD && (
              <path d={openPathD} fill="none"
                stroke="#f59e0b" strokeWidth="2.5"
                strokeDasharray="5,3" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Endpoint dot on open line */}
            {openPts.length > 0 && (() => {
              const last = openPts[openPts.length - 1];
              return (
                <>
                  {/* Outer glow ring */}
                  <circle cx={toX(last.time)} cy={toY(last.value)} r="7"
                    fill="#f59e0b" fillOpacity="0.18" />
                  <circle cx={toX(last.time)} cy={toY(last.value)} r="5"
                    fill="#f59e0b" stroke="#111" strokeWidth="2" />
                </>
              );
            })()}

            {/* Zero baseline — always visible when range crosses 0 */}
            {minV <= 0 && maxV >= 0 && (
              <line x1={padL} x2={padL + chartW} y1={zeroY} y2={zeroY}
                stroke="#3d3d3d" strokeWidth="1" strokeDasharray="4,3" />
            )}

            {/* ── X-axis tick labels ── */}
            {xTicks.map((t, i) => (
              <text key={i}
                x={toX(t)} y={padT + chartH + 16}
                fill="#6b7280" fontSize="10" textAnchor="middle" fontFamily="monospace">
                {fmtDate(t)}
              </text>
            ))}

            {/* ── Hover crosshair + tooltip ── */}
            {hover && (() => {
              const cx = Math.max(padL, Math.min(hover.x, padL + chartW));

              const lines = [
                hover.histVal !== null
                  ? { label: "Closed", val: hover.histVal, color: "#22c55e" }
                  : null,
                hover.openVal !== null && hasOpen
                  ? { label: "Open  ", val: hover.openVal, color: "#f59e0b" }
                  : null,
              ].filter(Boolean);

              const bW = 138, bH = lines.length * 16 + 12;
              const bX = cx + 12 + bW > padL + chartW ? cx - bW - 12 : cx + 12;
              const bY = padT + 6;

              return (
                <g>
                  {/* Crosshair */}
                  <line x1={cx} y1={padT} x2={cx} y2={padT + chartH}
                    stroke="#ffffff28" strokeWidth="1" strokeDasharray="4,3" />

                  {/* Dot on history line */}
                  {hover.histVal !== null && (
                    <circle cx={cx} cy={toY(hover.histVal)} r="4"
                      fill="#22c55e" stroke="#0a0a0a" strokeWidth="2" />
                  )}

                  {/* Dot on open line */}
                  {hover.openVal !== null && hasOpen && (
                    <circle cx={cx} cy={toY(hover.openVal)} r="4"
                      fill="#f59e0b" stroke="#0a0a0a" strokeWidth="2" />
                  )}

                  {/* Tooltip */}
                  {lines.length > 0 && (
                    <g>
                      <rect x={bX} y={bY} width={bW} height={bH}
                        rx="4" fill="#1a1a1a" fillOpacity="0.97"
                        stroke="#383838" strokeWidth="1" />
                      {lines.map((ln, i) => (
                        <text key={i} x={bX + 8} y={bY + 14 + i * 16}
                          fill={ln.color} fontSize="10" fontFamily="monospace" fontWeight="500">
                          {ln.label}  {pnlFmt(ln.val)}
                        </text>
                      ))}
                    </g>
                  )}
                </g>
              );
            })()}
          </>
        ) : (
          <text x={padL + chartW / 2} y={padT + chartH / 2}
            fill="#374151" fontSize="12" textAnchor="middle" dominantBaseline="middle">
            No history data
          </text>
        )}
      </svg>
    </div>
  );
}
