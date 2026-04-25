export default function Profile({ data, onLogout, onSwitchAccount }) {
  const account = data?.account;
  const email   = localStorage.getItem("userEmail") || "—";

  const mt5Fields = [
    { label: "Account Name", val: account?.name     ?? "—" },
    { label: "Login ID",     val: account?.login    ?? "—" },
    { label: "Server",       val: account?.server   ?? "—" },
    { label: "Currency",     val: account?.currency ?? "—" },
    { label: "Leverage",     val: account?.leverage ? `1:${account.leverage}` : "—" },
    { label: "Company",      val: account?.company  ?? "—" },
  ];

  return (
    <div className="p-5 min-h-full">
      <div className="mb-5">
        <p className="text-[10px] tracking-[0.22em] text-yellow-400/60 uppercase mb-1">
          Account
        </p>
        <h1 className="text-3xl font-bold text-white tracking-wider">Profile</h1>
      </div>

      <div className="max-w-lg space-y-4">
        {/* portal */}
        <div className="bg-[#111] rounded-xl p-5 border border-white/5">
          <p className="text-[10px] text-yellow-400/70 uppercase tracking-widest mb-4">
            Portal Account
          </p>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Email</span>
            <span className="text-white text-sm">{email}</span>
          </div>
        </div>

        {/* mt5 */}
        <div className="bg-[#111] rounded-xl p-5 border border-white/5">
          <p className="text-[10px] text-yellow-400/70 uppercase tracking-widest mb-4">
            MT5 Account
          </p>
          <div className="space-y-3">
            {mt5Fields.map(({ label, val }) => (
              <div
                key={label}
                className="flex justify-between border-b border-white/5 pb-2.5 last:border-0 last:pb-0"
              >
                <span className="text-gray-500 text-sm">{label}</span>
                <span className="text-white text-sm font-medium">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* switch account */}
        <button
          onClick={onSwitchAccount}
          className="w-full py-3 rounded-xl bg-yellow-500/8 border border-yellow-500/20 text-yellow-400/80
            text-sm font-semibold hover:bg-yellow-500/15 hover:text-yellow-400 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4M4 17h12m0 0l-4-4m4 4l-4 4" />
          </svg>
          Switch Account
        </button>

        {/* logout */}
        <button
          onClick={onLogout}
          className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
