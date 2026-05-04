import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import DashboardHome from "./pages/DashboardHome.jsx";
import OpenTrades from "./pages/OpenTrades.jsx";
import History from "./pages/History.jsx";
import Analytics from "./pages/Analytics.jsx";
import Profile from "./pages/Profile.jsx";
import useWebSocket from "./hooks/useWebSocket.js";
import { AnimatedPage, LiveBadge } from "../../components/ui/visual.jsx";

export default function Dashboard({ onLogout, onSwitchAccount }) {
  const [page, setPage]           = useState(localStorage.getItem("dashboard_page") || "dashboard");
  const [sidebarOpen, setSidebar] = useState(false);
  const { data, connected }       = useWebSocket();

  // ── Browser back-button support ───────────────────────────────────────────
  // Pressing back while on any sub-page returns to the main dashboard view.
  // We push one history entry when leaving "dashboard" so the entry is there
  // to pop; subsequent sub-page → sub-page navigation reuses that entry.
  useEffect(() => {
    const onPop = () => {
      setPage("dashboard");
      localStorage.setItem("dashboard_page", "dashboard");
      setSidebar(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (p) => {
    // Push a history entry only when leaving the dashboard root for the first time,
    // so the browser back button can bring the user back.
    if (page === "dashboard" && p !== "dashboard") {
      window.history.pushState({ crownstone: "sub", page: p }, "");
    }
    setPage(p);
    localStorage.setItem("dashboard_page", p);
    setSidebar(false);
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardHome data={data} connected={connected} />;
      case "trades":    return <OpenTrades data={data} tradeAllowed={data?.trade_allowed !== false} />;
      case "history":   return <History data={data} />;
      case "analytics": return <Analytics data={data} />;
      case "profile":   return <Profile data={data} onLogout={onLogout} onSwitchAccount={onSwitchAccount} />;
      default:          return null;
    }
  };

  return (
    <div className="dashboard-workspace flex h-screen h-[100dvh] bg-transparent overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebar(false)}
        />
      )}

      <Sidebar
        page={page}
        setPage={navigate}
        connected={connected}
        open={sidebarOpen}
        onClose={() => setSidebar(false)}
        onSwitchAccount={onSwitchAccount}
      />

      <main className="dashboard-main flex-1 overflow-y-auto min-w-0">
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-yellow-500/15 bg-[#050605]/85 backdrop-blur-xl sticky top-0 z-30">
          <button
            onClick={() => setSidebar(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg
              bg-white/5 border border-white/10 hover:border-yellow-500/30 transition-all text-gray-300"
          >
            <Menu className="h-4 w-4" />
          </button>
          <p className="text-xs font-bold tracking-widest text-yellow-400">CROWNSTONE</p>
          <LiveBadge active={connected} label={connected ? "Live" : "Off"} className="scale-90 origin-right" />
        </div>

        <AnimatePresence mode="wait">
          <AnimatedPage key={page} className="min-h-full">
            {renderPage()}
          </AnimatedPage>
        </AnimatePresence>
      </main>
    </div>
  );
}
