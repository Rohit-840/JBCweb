import { BarChart3, Clock3, LayoutDashboard, Repeat2, TrendingUp, UserRound, X } from "lucide-react";
import { motion } from "framer-motion";
import logo from "../../../assets/ldb.png";
import { LiveBadge, MotionButton } from "../../../components/ui/visual.jsx";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "trades", label: "Open Trades", icon: TrendingUp },
  { id: "history", label: "History", icon: Clock3 },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "profile", label: "Profile", icon: UserRound },
];

export default function Sidebar({ page, setPage, connected, open, onClose, onSwitchAccount }) {
  return (
    <aside
      className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-[210px] min-w-[210px] h-screen
        bg-[#0d0d0d] flex flex-col border-r border-white/5
        transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
    >
      <div className="flex flex-col font-bolin items-center pb-3 px-4 pt-3" style={{ fontFamily: "bolin gerii" }}>
        <div className="relative w-full flex items-center justify-center">
          <img
            src={logo}
            alt="JB Crownstone"
            className="w-[154px] h-[154px] p-1 rounded-lg object-contain drop-shadow-[0_0_18px_rgba(234,179,8,0.18)]"
          />
          <button
            onClick={onClose}
            className="lg:hidden absolute right-0 top-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p
          className="-mt-1 text-[18px] leading-6 font-bold tracking-[0.18em] text-yellow-400/90"
          style={{ textShadow: "0 0 6px rgba(212,175,55,0.4), 0 0 14px rgba(212,175,55,0.2)" }}
        >
          CROWNSTONE
        </p>
        <p className="text-[12px] leading-5 tracking-[0.22em] text-gray-500 uppercase">Private Wealth</p>
      </div>

      <div className="h-px bg-yellow-500/10 mx-4" />

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = page === item.id;
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              onClick={() => setPage(item.id)}
              whileTap={{ scale: 0.985 }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                active
                  ? "bg-yellow-500/[0.12] text-yellow-400 shadow-[inset_0_0_0_1px_rgba(245,197,66,0.12)]"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute left-0 top-2 bottom-2 w-[3px] bg-yellow-400 rounded-r-full"
                />
              )}
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      <div className="px-4 pb-6 space-y-2">
        <MotionButton
          variant="ghost"
          onClick={onSwitchAccount}
          className="w-full px-3 py-2.5 text-[11px] tracking-widest"
        >
          <Repeat2 className="h-3.5 w-3.5" />
          SWITCH ACCOUNT
        </MotionButton>

        <LiveBadge active={connected} label={connected ? "Live Session" : "Disconnected"} className="w-full justify-start" />
      </div>
    </aside>
  );
}
