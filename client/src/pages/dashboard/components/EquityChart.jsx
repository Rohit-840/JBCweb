import { useRef, useEffect, useState, useMemo } from "react";

// constants
const PERIODS     = ["1D", "1W", "1M", "1Y"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_SHORT   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// period start
function getPeriodCutoff(label) {
  const n = new Date();
  switch (label) {
    case "1D":
      return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 0, 0, 0, 0).getTime() / 1000;
    case "1W": {
      const d = n.getDay();                          // 0=Sun … 6=Sat
      const back = d === 0 ? -6 : 1 - d;            // shift to Monday
      return new Date(n.getFullYear(), n.getMonth(), n.getDate() + back, 0, 0, 0, 0).getTime() / 1000;
    }
    case "1M":
      return new Date(n.getFullYear(), n.getMonth(), 1, 0, 0, 0, 0).getTime() / 1000;
    case "1Y":
      return new Date(n.getFullYear(), 0, 1, 0, 0, 0, 0).getTime() / 1000;
    default:
      return 0;
  }
}

// period end
function getPeriodEnd(label) {
  const n = new Date();
  switch (label) {
    case "1D":
      // midnight tonight 
      return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 0, 0).getTime();
    case "1W": {
      // next monday midnight
      const d    = n.getDay();
      const fwd  = d === 0 ? 1 : 8 - d;
      return new Date(n.getFullYear(), n.getMonth(), n.getDate() + fwd, 0, 0, 0, 0).getTime();
    }
    case "1M":
      // first day of next month
      return new Date(n.getFullYear(), n.getMonth() + 1, 1, 0, 0, 0, 0).getTime();
    case "1Y":
      // jan 1 of next year
      return new Date(n.getFullYear() + 1, 0, 1, 0, 0, 0, 0).getTime();
    default:
      return Date.now();
  }
}

// build cumulative-pnl points
function buildPts(history, periodLabel) {
  const cutoff = getPeriodCutoff(periodLabel);
  const sorted = (history || [])
    .filter((h) => h.time >= cutoff)
    .sort((a, b) => a.time - b.time);
  let cum = 0;
  const pts = sorted.map((h) => ({ time: h.time * 1000, equity: (cum += h.profit) }));
  return [{ time: cutoff * 1000, equity: 0 }, ...pts];
}

// smooth cubic bezier svg line
function smoothPath(svgPts) {
  return svgPts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = svgPts[i - 1];
    const cpx  = ((prev.x + p.x) / 2).toFixed(1);
    return `${acc} C ${cpx} ${prev.y.toFixed(1)} ${cpx} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, "");
}

// x axis tick generator
function buildXTicks(minT, maxT, period, toX, padL, chartW) {
  const ticks    = [];
  const inBounds = (t) => { const x = toX(t); return x >= padL - 1 && x <= padL + chartW + 1; };

  if (period === "1D") {
    const base = new Date(minT);
    base.setHours(0, 0, 0, 0);
    for (let h = 0; h <= 20; h += 4) {
      const d = new Date(base.getTime());
      d.setHours(h);
      const t = d.getTime();
      if (inBounds(t))
        ticks.push({ x: toX(t), label: `${String(h).padStart(2, "0")}:00` });
    }

  } else if (period === "1W") {
    const d = new Date(minT);
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const t = d.getTime();
      if (inBounds(t))
        ticks.push({ x: toX(t), label: `${DAY_SHORT[d.getDay()]} ${d.getDate()}` });
      d.setDate(d.getDate() + 1);
    }

  } else if (period === "1M") {
    const d = new Date(minT);
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 5; i++) {
      const t = d.getTime();
      if (inBounds(t))
        ticks.push({ x: toX(t), label: `${MONTH_SHORT[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}` });
      d.setDate(d.getDate() + 7);
    }

  } else if (period === "1Y") {
    const d = new Date(minT);
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 12; i++) {
      const t = d.getTime();
      if (inBounds(t))
        ticks.push({ x: toX(t), label: MONTH_SHORT[d.getMonth()] });
      d.setMonth(d.getMonth() + 1);
    }
  }

  return ticks;
}

// auto-detect period from data range
function detectPeriod(minT, maxT) {
  const days = (maxT - minT) / 86_400_000;
  if (days <= 2)  return "1D";
  if (days <= 14) return "1W";
  if (days <= 60) return "1M";
  return "1Y";
}

// period filter button group
function PeriodSelector({ period, onChange }) {
  return (
    <div className="flex items-center bg-[#0a0a0a] border border-white/[0.07] rounded-lg p-[3px] gap-[2px]">
      {PERIODS.map((label) => {
        const active = period === label;
        return (
          <button
            key={label}
            onClick={() => onChange(label)}
            className={[
              "px-3 py-1 rounded-md text-[10px] font-bold tracking-[0.14em] transition-all duration-200",
              active ? "text-yellow-400 bg-yellow-500/[0.12]" : "text-gray-600 hover:text-gray-400",
            ].join(" ")}
            style={active ? {
              boxShadow: "0 0 10px rgba(234,179,8,0.18), inset 0 0 8px rgba(234,179,8,0.06)",
              border: "1px solid rgba(234,179,8,0.25)",
            } : { border: "1px solid transparent" }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// main component
export default function EquityChart({ fullHistory, account, strategyData, strategyName }) {
  const containerRef = useRef(null);
  const [width,  setWidth]  = useState(600);
  const [period, setPeriod] = useState("1M");
  const [nowMs,  setNowMs]  = useState(0);

  useEffect(() => {
    const obs = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    setNowMs(Date.now());
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const isStrategy = !!strategyData && strategyData.length >= 2;

  const accountEquityPts = useMemo(() => {
    const base = buildPts(fullHistory, period);

    const floatingPnl   = account?.profit;
    if (floatingPnl == null) return base;
    const lastCum        = base.length > 0 ? base[base.length - 1].equity : 0;
    const lastKnownTime  = base.length > 0 ? base[base.length - 1].time   : 0;
    const liveTime       = Math.max(nowMs || lastKnownTime + 1000, lastKnownTime + 1000);
    return [...base, { time: liveTime, equity: lastCum + floatingPnl }];
  }, [fullHistory, period, account?.profit, nowMs]);

  const strategyPts = useMemo(() => {
    if (!isStrategy) return [];
    const cutoff = getPeriodCutoff(period) * 1000;
    const sorted = [...strategyData].sort((a, b) => a.time - b.time);
    const beforeCutoff = [...sorted].reverse().find((p) => p.time < cutoff);
    const baseValue = beforeCutoff?.equity ?? 0;
    const visible = sorted
      .filter((p) => p.time >= cutoff)
      .map((p) => ({ ...p, equity: p.equity - baseValue }));
    return [{ time: cutoff, equity: 0 }, ...visible];
  }, [isStrategy, strategyData, period]);

  const primaryPts = isStrategy ? strategyPts : accountEquityPts;
  const allSeriesPts = isStrategy
    ? [...accountEquityPts, ...strategyPts]
    : accountEquityPts;
  const hasData = primaryPts.length >= 2;
  const hasAnyData = allSeriesPts.length >= 2;

  // layout
  const height = 240;
  const padL   = 54;
  const padR   = 12;
  const padT   = 20;
  const padB   = 30;
  const chartW = Math.max(width - padL - padR, 10);
  const chartH = height - padT - padB;

  // time range
  const dataMax  = hasAnyData ? Math.max(...allSeriesPts.map((p) => p.time)) : 1;
  const minT     = getPeriodCutoff(period) * 1000;
  const maxT     = Math.max(dataMax, getPeriodEnd(period));
  const tSpan    = maxT - minT || 1;

  // y scale
  const values  = hasAnyData ? allSeriesPts.map((p) => p.equity) : [0, 1];
  const rawMinV = Math.min(0, ...values);
  const rawMaxV = Math.max(...values);
  const vPad    = (rawMaxV - rawMinV || 1) * 0.12;
  const minV    = rawMinV - vPad;
  const maxV    = rawMaxV + vPad;
  const range   = maxV - minV || 1;

  const toX   = (t) => padL + ((t - minT) / tSpan) * chartW;
  const toY   = (v) => padT + (1 - (v - minV) / range) * chartH;
  const zeroY = toY(0);

  // svg paths
  const buildSeriesPath = (pts) => {
    if (!pts || pts.length < 2) return { pathD: "", areaD: "", svgPts: [] };
    const svgPts = pts.map((p) => ({ x: toX(p.time), y: toY(p.equity) }));
    const pathD  = smoothPath(svgPts);
    const f = svgPts[0], l = svgPts[svgPts.length - 1];
    const areaD  = `${pathD} L ${l.x.toFixed(1)} ${zeroY.toFixed(1)} L ${f.x.toFixed(1)} ${zeroY.toFixed(1)} Z`;
    return { pathD, areaD, svgPts };
  };

  let pathD = "", areaD = "", svgPts = [];
  if (hasData) {
    svgPts = primaryPts.map((p) => ({ x: toX(p.time), y: toY(p.equity) }));
    pathD  = smoothPath(svgPts);
    const f = svgPts[0], l = svgPts[svgPts.length - 1];
    areaD  = `${pathD} L ${l.x.toFixed(1)} ${zeroY.toFixed(1)} L ${f.x.toFixed(1)} ${zeroY.toFixed(1)} Z`;
  }
  const accountSeries  = buildSeriesPath(accountEquityPts);
  const strategySeries = buildSeriesPath(strategyPts);

  // y axis labels
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const frac = i / 4;
    const v    = minV + frac * range;
    const fmt  = Math.abs(v) >= 1000
      ? `$${(v / 1000).toFixed(1)}k`
      : `$${v.toFixed(0)}`;
    return { y: padT + (1 - frac) * chartH, val: fmt };
  });

  // x axis ticks
  const effectivePeriod = isStrategy ? detectPeriod(minT, maxT) : period;
  const xTicks = hasData
    ? buildXTicks(minT, maxT, effectivePeriod, toX, padL, chartW)
    : [];

  // colors & labels
  const lineColor = isStrategy ? "#22c55e" : "#d4af37";
  const gradColor = isStrategy ? "#22c55e" : "#d4af37";
  const title     = isStrategy ? `${strategyName} P/L` : "Equity Curve";

  const latestVal = hasData ? primaryPts[primaryPts.length - 1].equity : null;
  const latestAccountVal = accountEquityPts.length >= 2 ? accountEquityPts[accountEquityPts.length - 1].equity : null;
  const latestFmt = latestVal !== null
    ? `${latestVal >= 0 ? "+" : ""}$${Math.abs(latestVal).toLocaleString("en-US", { maximumFractionDigits: 2 })}`
    : null;
  const latestAccountFmt = latestAccountVal !== null
    ? `${latestAccountVal >= 0 ? "+" : ""}$${Math.abs(latestAccountVal).toLocaleString("en-US", { maximumFractionDigits: 2 })}`
    : null;

  return (
    <div
      className="relative bg-[#0d0d0d] rounded-2xl p-5 border border-white/[0.06] flex-1 min-w-0 overflow-hidden"
      style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 4px 32px rgba(0,0,0,0.5)" }}
    >
      {/* ambient corner glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full"
        style={{ background: `radial-gradient(circle, ${gradColor}14 0%, transparent 70%)` }} />

      {/* header */}
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <p className="text-[9px] tracking-[0.22em] text-yellow-500/50 uppercase font-bold mb-0.5">
            Performance
          </p>
          <div className="flex items-baseline gap-2.5">
            <p className="text-white font-semibold text-sm">{title}</p>
            {latestVal !== null && (
              <span className={`text-xs font-bold ${latestVal >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {latestFmt}
              </span>
            )}
            {isStrategy && latestAccountFmt && (
              <span className="text-[10px] font-bold text-yellow-400/80">
                Equity {latestAccountFmt}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {isStrategy && (
            <span className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-lg
              bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
              {strategyName}
            </span>
          )}
          <PeriodSelector period={period} onChange={setPeriod} />
        </div>
      </div>

      {isStrategy && (
        <div className="flex items-center gap-4 mb-2 px-1">
          <div className="flex items-center gap-2">
            <svg width="24" height="8">
              <line x1="0" y1="4" x2="24" y2="4" stroke="#d4af37" strokeWidth="2" />
            </svg>
            <span className="text-[10px] text-yellow-400/80 font-semibold tracking-wide">Equity Curve</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="24" height="8">
              <line x1="0" y1="4" x2="24" y2="4" stroke="#22c55e" strokeWidth="2" />
            </svg>
            <span className="text-[10px] text-emerald-400 font-semibold tracking-wide">{strategyName} P/L</span>
          </div>
        </div>
      )}

      {/* svg chart */}
      <div ref={containerRef} className="w-full">
        <svg width={width} height={height} style={{ display: "block" }}>
          <defs>
            <linearGradient id="ecAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={gradColor} stopOpacity="0.30" />
              <stop offset="60%"  stopColor={gradColor} stopOpacity="0.06" />
              <stop offset="100%" stopColor={gradColor} stopOpacity="0"    />
            </linearGradient>
            <filter id="ecGlow" x="-20%" y="-60%" width="140%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <pattern id="ecScan" width="1" height="3" patternUnits="userSpaceOnUse">
              <rect width="1" height="1" fill="rgba(255,255,255,0.012)" />
            </pattern>
          </defs>

          {/* scan line overlay */}
          <rect x={padL} y={padT} width={chartW} height={chartH} fill="url(#ecScan)" />

          {/* axis borders */}
          <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#2a2a2a" strokeWidth="1" />
          <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#2a2a2a" strokeWidth="1" />

          {/* horizontal grid lines */}
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={i}
              x1={padL} y1={padT + (i / 4) * chartH}
              x2={padL + chartW} y2={padT + (i / 4) * chartH}
              stroke={i === 4 ? "#2a2a2a" : "#1a1a1a"} strokeWidth="1"
            />
          ))}

          {/* vertical grid lines */}
          {xTicks.map((t, i) => (
            <line key={`vg${i}`}
              x1={t.x} y1={padT} x2={t.x} y2={padT + chartH}
              stroke="#181818" strokeWidth="1"
            />
          ))}

          {/* y axis labels */}
          {yTicks.map((t, i) => (
            <text key={i} x={padL - 6} y={t.y + 4}
              fill="#555" fontSize="9" fontFamily="monospace" textAnchor="end">
              {t.val}
            </text>
          ))}

          {hasData ? (
            <>
              {/* zero baseline */}
              {minV < 0 && maxV > 0 && (
                <line x1={padL} x2={padL + chartW} y1={zeroY} y2={zeroY}
                  stroke="#333" strokeWidth="1" strokeDasharray="4,3" />
              )}

              {isStrategy ? (
                <>
                  {accountSeries.areaD && <path d={accountSeries.areaD} fill="url(#ecAreaGrad)" opacity="0.45" />}
                  {accountSeries.pathD && (
                    <>
                      <path d={accountSeries.pathD} fill="none"
                        stroke="#d4af37" strokeWidth="3" strokeLinecap="round"
                        filter="url(#ecGlow)" opacity="0.35" />
                      <path d={accountSeries.pathD} fill="none"
                        stroke="#d4af37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
                    </>
                  )}

                  {strategySeries.pathD && (
                    <>
                      <path d={strategySeries.pathD} fill="none"
                        stroke="#22c55e" strokeWidth="3" strokeLinecap="round"
                        filter="url(#ecGlow)" opacity="0.45" />
                      <path d={strategySeries.pathD} fill="none"
                        stroke="#22c55e" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  )}

                  {accountSeries.svgPts.length > 0 && (() => {
                    const last = accountSeries.svgPts[accountSeries.svgPts.length - 1];
                    return (
                      <>
                        <circle cx={last.x} cy={last.y} r="5" fill="#d4af37" fillOpacity="0.12" />
                        <circle cx={last.x} cy={last.y} r="2.5" fill="#d4af37" stroke="#0d0d0d" strokeWidth="1.5" />
                      </>
                    );
                  })()}

                  {strategySeries.svgPts.length > 0 && (() => {
                    const last = strategySeries.svgPts[strategySeries.svgPts.length - 1];
                    return (
                      <>
                        <circle cx={last.x} cy={last.y} r="6" fill="#22c55e" fillOpacity="0.12" />
                        <circle cx={last.x} cy={last.y} r="3" fill="#22c55e" stroke="#0d0d0d" strokeWidth="1.5" />
                      </>
                    );
                  })()}
                </>
              ) : (
                <>
                  {/* area fill */}
                  <path d={areaD} fill="url(#ecAreaGrad)" />

                  {/* glow layer */}
                  <path d={pathD} fill="none"
                    stroke={lineColor} strokeWidth="3" strokeLinecap="round"
                    filter="url(#ecGlow)" opacity="0.55" />

                  {/* sharp line */}
                  <path d={pathD} fill="none"
                    stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

                  {svgPts.length > 0 && (() => {
                    const last = svgPts[svgPts.length - 1];
                    return (
                      <>
                        <circle cx={last.x} cy={last.y} r="6" fill={lineColor} fillOpacity="0.12" />
                        <circle cx={last.x} cy={last.y} r="3" fill={lineColor} stroke="#0d0d0d" strokeWidth="1.5" />
                      </>
                    );
                  })()}
                </>
              )}

              {/* x axis labels */}
              {xTicks.map((t, i) => (
                <text key={i} x={t.x} y={height - 6}
                  fill="#555" fontSize="9" textAnchor="middle" fontFamily="monospace">
                  {t.label}
                </text>
              ))}
            </>
          ) : (
            <text x={padL + chartW / 2} y={padT + chartH / 2}
              fill="#2a2a2a" fontSize="12" textAnchor="middle" dominantBaseline="middle"
              fontFamily="monospace">
              {isStrategy
                ? "No strategy trade data"
                : `No trades ${period === "1D" ? "today" : period === "1W" ? "this week" : period === "1M" ? "this month" : "this year"}`}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
