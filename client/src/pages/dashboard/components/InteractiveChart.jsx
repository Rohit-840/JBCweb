import { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";

export default function InteractiveChart({ history = [], trades = [] }) {
  const [userBounds, setUserBounds] = useState(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const { seriesData, maxX, minX } = useMemo(() => {
    try {
      // 1. Build Closed P&L series safely
      const sortedHist = [...(history || [])].sort((a, b) => (a.time || 0) - (b.time || 0));
      const closedSeries = [];
      let closedCum = 0;
      for (const d of sortedHist) {
        closedCum += d.profit || 0;
        closedSeries.push([(d.time || 0) * 1000, closedCum]);
      }

      // 2. Build Open Positions projection safely
      const lastHistValue = closedSeries.length > 0 ? closedSeries[closedSeries.length - 1][1] : 0;
      const lastHistTimeMs = closedSeries.length > 0 ? closedSeries[closedSeries.length - 1][0] : nowMs - 3600000;

      let openSeries = [];
      const validTrades = trades || [];
      if (validTrades.length > 0) {
        const sortedTrades = [...validTrades].sort((a, b) => (a.time || 0) - (b.time || 0));
        let openCum = lastHistValue;
        openSeries.push([lastHistTimeMs, openCum]);

        for (const t of sortedTrades) {
          const tTimeMs = Math.max((t.time || 0) * 1000, lastHistTimeMs);
          if (openSeries[openSeries.length - 1][0] < tTimeMs) {
            openSeries.push([tTimeMs, openCum]);
          }
          openCum += t.profit || 0;
          openSeries.push([tTimeMs, openCum]);
        }

        if (openSeries[openSeries.length - 1][0] < nowMs) {
          openSeries.push([nowMs, openCum]);
        }
      }

      const result = [];
      if (closedSeries.length > 0) {
        result.push({
          name: "Closed P&L",
          data: closedSeries,
          type: "area",
        });
      }

      if (openSeries.length > 0) {
        result.push({
          name: "Open Projection",
          data: openSeries,
          type: "line",
        });
      }

      if (result.length === 0) {
        return { seriesData: [], maxX: undefined, minX: undefined };
      }

      // Calculate true max time (in case MT5 server time is slightly ahead of local Date.now)
      const maxDataTime = Math.max(
        nowMs,
        closedSeries.length > 0 ? closedSeries[closedSeries.length - 1][0] : 0,
        openSeries.length > 0 ? openSeries[openSeries.length - 1][0] : 0
      );

      // Calculate space with failsafes
      const minT = closedSeries.length > 0 ? closedSeries[0][0] : maxDataTime - 86400000;
      
      // Default Zoom
      let calculatedMinX = minT;
      const LOOKBACK_TRADES = 15;
      if (closedSeries.length > LOOKBACK_TRADES) {
        calculatedMinX = closedSeries[closedSeries.length - LOOKBACK_TRADES][0];
      }
      
      if (openSeries.length > 0 && openSeries[0][0] < calculatedMinX) {
        calculatedMinX = openSeries[0][0];
      }
      
      const viewSpan = maxDataTime - calculatedMinX || 86400000;
      calculatedMinX = Math.floor(calculatedMinX - (viewSpan * 0.05));

      const tSpan = maxDataTime - minT || 86400000;
      const calculatedMaxX = Math.ceil(maxDataTime + tSpan * 0.08);

      // Final bounds check to prevent ApexCharts crash
      if (calculatedMinX >= calculatedMaxX || isNaN(calculatedMinX) || isNaN(calculatedMaxX)) {
        return { seriesData: result, minX: undefined, maxX: undefined };
      }

      return { seriesData: result, maxX: calculatedMaxX, minX: calculatedMinX };
    } catch (e) {
      console.error("InteractiveChart error:", e);
      return { seriesData: [], maxX: undefined, minX: undefined };
    }
  }, [history, trades, nowMs]);

  const options = useMemo(() => ({
    chart: {
      type: "line",
      background: "transparent",
      animations: { enabled: false },
      toolbar: {
        show: true,
        tools: {
          download: false,
          selection: false,
          zoom: false,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
        autoSelected: "pan",
      },
      fontFamily: "'Inter', sans-serif, monospace",
      events: {
        zoomed: function(chartContext, { xaxis }) {
          if (xaxis && xaxis.min !== undefined && xaxis.max !== undefined) {
            setUserBounds({ min: xaxis.min, max: xaxis.max });
          } else {
            setUserBounds(null); // Reset zoom
          }
        },
        scrolled: function(chartContext, { xaxis }) {
          if (xaxis && xaxis.min !== undefined && xaxis.max !== undefined) {
            setUserBounds({ min: xaxis.min, max: xaxis.max });
          }
        }
      }
    },
    colors: ["#10b981", "#f59e0b"],
    theme: {
      mode: "dark",
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "stepline",
      width: [2, 2.5],
      dashArray: [0, 5],
    },
    fill: {
      type: ["gradient", "solid"],
      opacity: [1, 1],
      gradient: {
        inverseColors: false,
        shade: 'dark',
        type: 'vertical',
        opacityFrom: 0.4,
        opacityTo: 0.03,
        stops: [0, 100],
      },
    },
    xaxis: {
      type: "datetime",
      max: userBounds ? userBounds.max : maxX,
      min: userBounds ? userBounds.min : minX,
      tooltip: {
        enabled: false,
      },
      labels: {
        style: {
          colors: "#9ca3af",
          fontSize: "11px",
          fontWeight: 500,
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        formatter: (val) => `$${val.toFixed(2)}`,
        style: {
          colors: "#9ca3af",
          fontSize: "11px",
          fontWeight: 600,
        },
      },
      axisBorder: {
        show: false,
      },
      crosshairs: {
        show: true,
        stroke: {
          color: "#ffffff33",
          dashArray: 4,
        }
      },
    },
    grid: {
      borderColor: "#ffffff10",
      strokeDashArray: 4,
      xaxis: {
        lines: { show: true },
      },
      yaxis: {
        lines: { show: true },
      },
      padding: {
        top: 0,
        right: 15,
        bottom: 0,
        left: 15
      }
    },
    tooltip: {
      theme: "dark",
      x: { format: "dd MMM yyyy HH:mm" },
      y: {
        formatter: (val) => `$${val.toFixed(2)}`,
      },
      style: {
        fontSize: "13px",
      },
      marker: {
        show: true,
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontSize: "13px",
      fontWeight: 600,
      labels: {
        colors: "#e5e7eb",
      },
      markers: {
        size: 6,
      }
    },
  }), [maxX, minX, userBounds]);

  return (
    <div className="w-full h-full relative flex items-center justify-center min-h-[350px]">
      <div className="absolute inset-0">
        {userBounds && (
          <button
            onClick={() => setUserBounds(null)}
            className="absolute top-2 right-32 z-10 bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-300 text-xs px-3 py-1.5 rounded-lg shadow-lg transition-colors duration-200"
          >
            Resume Live Tracking
          </button>
        )}
        {seriesData && seriesData.length > 0 ? (
          <ReactApexChart
            options={options}
            series={seriesData}
            type="line"
            height="100%"
            width="100%"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-500 font-medium">
            No data available for chart.
          </div>
        )}
      </div>
    </div>
  );
}
