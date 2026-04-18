import { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import DashboardHome from "./pages/DashboardHome.jsx";
import OpenTrades from "./pages/OpenTrades.jsx";
import History from "./pages/History.jsx";
import Analytics from "./pages/Analytics.jsx";
import Profile from "./pages/Profile.jsx";
import useWebSocket from "./hooks/useWebSocket.js";

export default function Dashboard({ onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [filteredSymbols, setFilteredSymbols] = useState(null);
  const { data, connected } = useWebSocket();

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return (
          <DashboardHome
            data={data}
            connected={connected}
            onFilterChange={setFilteredSymbols}
          />
        );
      case "trades":
        return <OpenTrades data={data} filteredSymbols={filteredSymbols} />;
      case "history":
        return <History data={data} filteredSymbols={filteredSymbols} />;
      case "analytics":
        return <Analytics data={data} />;
      case "profile":
        return <Profile data={data} onLogout={onLogout} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      <Sidebar page={page} setPage={setPage} connected={connected} />
      <main className="flex-1 overflow-y-auto">{renderPage()}</main>
    </div>
  );
}
