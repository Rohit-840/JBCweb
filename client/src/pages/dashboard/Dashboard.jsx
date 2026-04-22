import { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import DashboardHome from "./pages/DashboardHome.jsx";
import OpenTrades from "./pages/OpenTrades.jsx";
import History from "./pages/History.jsx";
import Analytics from "./pages/Analytics.jsx";
import Profile from "./pages/Profile.jsx";
import useWebSocket from "./hooks/useWebSocket.js";

export default function Dashboard({ onLogout, onSwitchAccount }) {
  const [page, setPage]           = useState("dashboard");
  const [sidebarOpen, setSidebar] = useState(false);
  const { data, connected }       = useWebSocket();

  const navigate = (p) => { setPage(p); setSidebar(false); };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardHome data={data} connected={connected} />;
      case "trades":    return <OpenTrades data={data} />;
      case "history":   return <History data={data} />;
      case "analytics": return <Analytics data={data} />;
      case "profile":   return <Profile data={data} onLogout={onLogout} onSwitchAccount={onSwitchAccount} />;
      default:          return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
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

      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0d0d0d] sticky top-0 z-30">
          <button
            onClick={() => setSidebar(true)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg
              bg-white/5 border border-white/10 hover:border-white/20 transition-all"
          >
            <span className="w-4 h-px bg-gray-400" />
            <span className="w-4 h-px bg-gray-400" />
            <span className="w-4 h-px bg-gray-400" />
          </button>
          <p className="text-xs font-bold tracking-widest text-yellow-400">CROWNSTONE</p>
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-500"}`} />
        </div>

        {renderPage()}
      </main>
    </div>
  );
}
