import logo from "../../../assets/new3.webp";

const NAV = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "trades",
    label: "Open Trades",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
  {
    id: "history",
    label: "History",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

export default function Sidebar({ page, setPage, connected }) {
  return (
    <div className="w-[210px] min-w-[210px] h-screen bg-[#0d0d0d] flex flex-col border-r border-white/5">
      {/* Logo */}
      <div className="flex flex-col items-center pt-7 pb-5 px-4">
        <img
          src={logo}
          alt="JB Crownstone"
          className="w-16 h-16 rounded-xl object-cover"
        />
        <p className="mt-3 text-[11px] font-bold tracking-[0.18em] text-yellow-400/90">
          CROWNSTONE
        </p>
        <p className="text-[9px] tracking-[0.22em] text-gray-600 uppercase">
          Private Wealth
        </p>
      </div>

      <div className="h-px bg-white/5 mx-4" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative
                ${active
                  ? "bg-yellow-500/10 text-yellow-400"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-yellow-400 rounded-r-full" />
              )}
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Connection status */}
      <div className="px-4 pb-6">
        <div
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-semibold tracking-widest
            ${connected
              ? "border-green-500/30 bg-green-500/5 text-green-400"
              : "border-red-500/20 bg-red-500/5 text-red-500"
            }`}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              connected ? "bg-green-400 animate-pulse" : "bg-red-500"
            }`}
          />
          {connected ? "LIVE SESSION" : "DISCONNECTED"}
        </div>
      </div>
    </div>
  );
}
