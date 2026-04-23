import { useRef, useEffect, useState } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildHistPts(history) {
  if (!history || history.length === 0) return [];
  const sorted = [...history].sort((a, b) => a.time - b.time);
  let cum = 0;
  return sorted.map((d) => ({ time: d.time, value: (cum += d.profit) }));
}

function pnlFmt(v) {
  return `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
}

// Smooth cubic-bezier SVG path through an array of {x,y} points
function smoothPath(pts) {
  return pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cpx  = ((prev.x + p.x) / 2).toFixed(1);
    return `${acc} C ${cpx} ${prev.y.toFixed(1)} ${cpx} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, "");
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SymbolChart({ history, trades = [], height = 260 }) {
  const wrapRef  = useRef(null);
  const svgRef   = useRef(null);
  const [width,  setWidth]  = useState(400);
  const [hover,  setHover]  = useState(null); // {x, histVal, openVal}

  useEffect(() => {
    const obs = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    if (wrapRef.current) obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  const padL = 8, padR = 52, padT = 12, padB = 28;
  const chartW = Math.max(width - padL - padR, 10);
  const chartH = height - padT - padB;

  // ── History cumulative P&L ────────────────────────────────────────────────
  const histPts   = buildHistPts(history);
  const hasHist   = histPts.length >= 2;

  // ── Open positions "projection" line ─────────────────────────────────────
  // A two-point line: from (last closed trade time, last cumulative P&L)
  //                     to  (now,                  cumulative + total floating)
  // This shows "where you stand if you closed everything now."
  const now            = Math.floor(Date.now() / 1000);
  const lastHistValue  = histPts.length > 0 ? histPts[histPts.length - 1].value : 0;
  const lastHistTime   = histPts.length > 0 ? histPts[histPts.length - 1].time  : now - 3600;
  const totalOpenPnl   = trades.reduce((s, t) => s + (t.profit || 0), 0);
  const hasOpen        = trades.length > 0;

  // Sort open trades by open time to build a stepped projection
  const sortedTrades = hasOpen ? [...trades].sort((a, b) => a.time - b.time) : [];
  let openPts = [];
  if (hasOpen) {
    let cum = lastHistValue;
    openPts  = [{ time: lastHistTime, value: cum }];
    for (const t of sortedTrades) {
      const tTime = Math.max(t.time, lastHistTime);
      if (openPts[openPts.length - 1].time < tTime)
        openPts.push({ time: tTime, value: cum });   // horizontal step
      cum += t.profit || 0;
      openPts.push({ time: tTime, value: cum });      // vertical step
    }
    if (openPts[openPts.length - 1].time < now)
      openPts.push({ time: now, value: cum });         // extend to now
  }

  // ── Combined scale ────────────────────────────────────────────────────────
  const allVals = [0, ...histPts.map(p => p.value), ...openPts.map(p => p.value)];
  const allTs   = [...histPts.map(p => p.time), ...(hasOpen ? [now] : [])];
  const minV  = Math.min(...allVals);
  const maxV  = Math.max(...allVals);
  const range = maxV - minV || 1;
  const minT  = allTs.length ? Math.min(...allTs) : 0;
  const maxT  = allTs.length ? Math.max(...allTs) : 1;
  const tSpan = maxT - minT || 1;

  const toX = (t) => padL + ((t - minT) / tSpan) * chartW;
  const toY = (v) => padT + (1 - (v - minV) / range) * chartH;
  const zeroY = toY(0);

  // ── History SVG paths ─────────────────────────────────────────────────────
  let histPathD = "", histAreaD = "";
  if (hasHist) {
    const svgPts = histPts.map(p => ({ x: toX(p.time), y: toY(p.value) }));
    histPathD = smoothPath(svgPts);
    const f = svgPts[0], l = svgPts[svgPts.length - 1];
    histAreaD = `${histPathD} L ${l.x.toFixed(1)} ${zeroY.toFixed(1)} L ${f.x.toFixed(1)} ${zeroY.toFixed(1)} Z`;
  }

  // ── Open positions SVG path ───────────────────────────────────────────────
  const openPathD = openPts.length >= 2
    ? openPts.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.time).toFixed(1)} ${toY(p.value).toFixed(1)}`).join(" ")
    : "";

  // ── Y and X axis labels ───────────────────────────────────────────────────
  const yLabels = (hasHist || hasOpen) ? Array.from({ length: 5 }, (_, i) => {
    const frac = i / 4;
    const v    = minV + frac * range;
    return { y: padT + (1 - frac) * chartH, val: `$${v.toFixed(0)}`, pos: v >= 0 };
  }) : [];

  const xLabelTs = hasHist && histPts.length >= 2
    ? Array.from({ length: Math.min(5, histPts.length) }, (_, i) => {
        const idx = Math.floor((i / (Math.min(5, histPts.length) - 1)) * (histPts.length - 1));
        return histPts[idx].time;
      })
    : [];

  // ── Mouse interaction ─────────────────────────────────────────────────────
  const onMouseMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const { left } = svg.getBoundingClientRect();
    const mx    = e.clientX - left;
    const mouseT = minT + ((mx - padL) / chartW) * tSpan;

    // Nearest history P&L
    let histVal = null;
    if (histPts.length > 0) {
      let best = histPts[0];
      for (const p of histPts)
        if (Math.abs(p.time - mouseT) < Math.abs(best.time - mouseT)) best = p;
      histVal = best.value;
    }

    // Interpolated open P&L at mouseT
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
        <div className="flex items-center gap-4 px-1 mb-2">
          {hasHist && (
            <div className="flex items-center gap-1.5">
              <svg width="18" height="6">
                <line x1="0" y1="3" x2="18" y2="3" stroke="#22c55e" strokeWidth="1.5" />
              </svg>
              <span className="text-[9px] text-gray-500 font-mono tracking-wide">Closed P&L</span>
            </div>
          )}
          {hasOpen && (
            <div className="flex items-center gap-1.5">
              <svg width="18" height="6">
                <line x1="0" y1="3" x2="18" y2="3"
                  stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,2" />
              </svg>
              <span className="text-[9px] text-gray-500 font-mono tracking-wide">
                Open (+{pnlFmt(totalOpenPnl)})
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── SVG chart ── */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ display: "block", cursor: hasHist || hasOpen ? "crosshair" : "default" }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="symHistArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#22c55e" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0"    />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={i}
            x1={padL} y1={padT + (i / 4) * chartH}
            x2={padL + chartW} y2={padT + (i / 4) * chartH}
            stroke="#1c1c1c" strokeWidth="1"
          />
        ))}

        {(hasHist || hasOpen) ? (
          <>
            {/* History gradient fill */}
            {hasHist && <path d={histAreaD} fill="url(#symHistArea)" />}

            {/* History line */}
            {hasHist && (
              <path d={histPathD} fill="none"
                stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
            )}

            {/* Open positions dashed line (amber) */}
            {openPathD && (
              <path d={openPathD} fill="none"
                stroke="#f59e0b" strokeWidth="1.5"
                strokeDasharray="5,3" strokeLinecap="round" />
            )}

            {/* Endpoint dot on open line */}
            {openPts.length > 0 && (() => {
              const last = openPts[openPts.length - 1];
              return (
                <circle
                  cx={toX(last.time)} cy={toY(last.value)} r="3"
                  fill="#f59e0b" stroke="#111" strokeWidth="1.5"
                />
              );
            })()}

            {/* Zero baseline */}
            {minV < 0 && maxV > 0 && (
              <line x1={padL} x2={padL + chartW} y1={zeroY} y2={zeroY}
                stroke="#333" strokeWidth="1" strokeDasharray="3,3" />
            )}

            {/* Y labels */}
            {yLabels.map((l, i) => (
              <text key={i} x={padL + chartW + 4} y={l.y + 4}
                fill="#4a4a4a" fontSize="9" fontFamily="monospace">{l.val}</text>
            ))}

            {/* X labels */}
            {xLabelTs.map((t, i) => {
              const d = new Date(t * 1000);
              return (
                <text key={i} x={toX(t)} y={height - 4}
                  fill="#4a4a4a" fontSize="9" textAnchor="middle" fontFamily="monospace">
                  {`${d.getDate()}/${d.getMonth() + 1}`}
                </text>
              );
            })}

            {/* ── Hover overlay ── */}
            {hover && (() => {
              const cx = Math.max(padL, Math.min(hover.x, padL + chartW));

              // Tooltip lines
              const lines = [
                hover.histVal !== null ? { label: "Closed", val: hover.histVal, color: "#22c55e" } : null,
                hover.openVal !== null && hasOpen ? { label: "Open  ", val: hover.openVal, color: "#f59e0b" } : null,
              ].filter(Boolean);

              const bW = 130, bH = lines.length * 15 + 10;
              const bX = cx + 10 + bW > padL + chartW ? cx - bW - 10 : cx + 10;
              const bY = padT + 4;

              return (
                <g>
                  {/* Vertical crosshair */}
                  <line x1={cx} y1={padT} x2={cx} y2={padT + chartH}
                    stroke="#ffffff15" strokeWidth="1" strokeDasharray="3,3" />

                  {/* Dot on history line */}
                  {hover.histVal !== null && (
                    <circle cx={cx} cy={toY(hover.histVal)} r="3"
                      fill="#22c55e" stroke="#0d0d0d" strokeWidth="1.5" />
                  )}

                  {/* Dot on open line */}
                  {hover.openVal !== null && hasOpen && (
                    <circle cx={cx} cy={toY(hover.openVal)} r="3"
                      fill="#f59e0b" stroke="#0d0d0d" strokeWidth="1.5" />
                  )}

                  {/* Tooltip box */}
                  {lines.length > 0 && (
                    <g>
                      <rect x={bX} y={bY} width={bW} height={bH}
                        rx="3" fill="#161616" fillOpacity="0.95"
                        stroke="#2d2d2d" strokeWidth="1" />
                      {lines.map((ln, i) => (
                        <text key={i}
                          x={bX + 7} y={bY + 13 + i * 15}
                          fill={ln.color} fontSize="9" fontFamily="monospace">
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
            fill="#2a2a2a" fontSize="11" textAnchor="middle" dominantBaseline="middle">
            No history data
          </text>
        )}
      </svg>
    </div>
  );
}
