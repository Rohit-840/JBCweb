import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import logo from "../../assets/logo.jpeg";

const BROKER_SERVERS = [
  // ── Pepperstone demo ────────────────────────────────────────
  { label: "Pepperstone-Demo",              value: "Pepperstone-Demo" },
  { label: "PepperstoneCroupier-Demo",      value: "PepperstoneCroupier-Demo" },
  { label: "PepperstoneCroupier-Demo 2",    value: "PepperstoneCroupier-Demo 2" },
  // ── Pepperstone live ────────────────────────────────────────
  { label: "Pepperstone Financial Markets Limited", value: "Pepperstone Financial Markets Limited" },
  { label: "Pepperstone Financial Services L.L.C",  value: "Pepperstone Financial Services L.L.C" },
  { label: "Pepperstone Group Limited",             value: "Pepperstone Group Limited" },
  { label: "Pepperstone Limited",                   value: "Pepperstone Limited" },
  { label: "PepperstoneCroupier-Live",              value: "PepperstoneCroupier-Live" },
];
const CUSTOM_VALUE = "__custom__";

export default function ConnectMT5({ onSuccess, onBack = null }) {
  const [login,        setLogin]        = useState("");
  const [password,     setPassword]     = useState("");
  const [server,       setServer]       = useState("");
  const [customServer, setCustomServer] = useState("");
  const [loading,      setLoading]      = useState(false);
  const [msg,          setMsg]          = useState({ text: "", type: "info" });
  const [showHints,    setShowHints]    = useState(false);
  const successTimer = useRef(null);

  const effectiveServer = server === CUSTOM_VALUE ? customServer.trim() : server;

  const connectAccount = async () => {
    if (!login.trim()) {
      setMsg({ text: "Please enter your MT5 Login ID.", type: "error" });
      return;
    }
    if (!password.trim()) {
      setMsg({ text: "Please enter your MT5 Password.", type: "error" });
      return;
    }
    if (!effectiveServer) {
      setMsg({ text: "Please select or enter a broker server.", type: "error" });
      return;
    }

    setLoading(true);
    setMsg({ text: "", type: "info" });
    setShowHints(false);

    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/mt5/add",
        { login: login.trim(), password: password.trim(), server: effectiveServer },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.alreadyConnected) {
        setMsg({ text: "Account already connected. Redirecting…", type: "success" });
      } else {
        setMsg({ text: "MT5 Connected Successfully!", type: "success" });
      }
      successTimer.current = setTimeout(() => onSuccess(), 1200);

    } catch (err) {
      setLoading(false);
      const raw = err.response?.data?.message || "";

      // Provide specific guidance for known MT5 error codes
      if (raw.includes("-6") || raw.toLowerCase().includes("auth")) {
        setMsg({
          text: "Authorization failed — see tips below.",
          type: "error",
        });
        setShowHints(true);
      } else if (raw.includes("-2") || raw.toLowerCase().includes("no connection")) {
        setMsg({
          text: "Cannot reach broker server. Check the server name is correct and your internet connection.",
          type: "error",
        });
      } else {
        setMsg({
          text: raw || "Connection failed. Please check your credentials.",
          type: "error",
        });
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") connectAccount();
  };

  const msgColor =
    msg.type === "success" ? "text-emerald-400" :
    msg.type === "error"   ? "text-red-400"     :
    "text-yellow-400";

  useEffect(() => () => {
    clearTimeout(successTimer.current);
  }, []);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-transparent flex items-center justify-center px-4 py-10 relative overflow-y-auto">

      {/* Background glow */}
      <div className="absolute w-[400px] h-[400px] bg-yellow-500/10 blur-3xl rounded-full top-0 left-0 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] bg-yellow-500/10 blur-3xl rounded-full bottom-0 right-0 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-[#0b0b0b] border border-yellow-500/20 rounded-3xl p-8 relative z-10 shadow-[0_0_50px_rgba(255,215,0,0.08)]"
      >
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-gray-500 hover:text-yellow-400 text-xs mb-6 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to accounts
          </button>
        )}

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="logo" className="w-20 h-20 rounded-full object-cover border border-yellow-500/30" />
          <h1 className="text-3xl text-yellow-400 mt-4 font-semibold">Connect MT5</h1>
          <p className="text-gray-400 mt-2 text-sm tracking-wider uppercase">Secure Trading Integration</p>
        </div>

        {/* Security note */}
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-sm text-yellow-300">
          Your credentials are encrypted and securely processed.
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="MT5 Login ID"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="w-full bg-[#111] border border-yellow-500/10 rounded-xl px-4 py-3 text-white outline-none
              focus:border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />

          <div className="space-y-1">
            <input
              type="password"
              placeholder="MT5 Password (master/trading password)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="w-full bg-[#111] border border-yellow-500/10 rounded-xl px-4 py-3 text-white outline-none
                focus:border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
            <p className="text-[11px] text-gray-600 pl-1">
              Use the <span className="text-yellow-500/60">master (trading) password</span>, not the investor/read-only password.
            </p>
          </div>

          {/* Server selector */}
          <div className="space-y-2">
            <select
              value={server}
              onChange={(e) => { setServer(e.target.value); setShowHints(false); }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="w-full bg-[#111] border border-yellow-500/10 rounded-xl px-4 py-3 text-white outline-none
                focus:border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <option value="">Select Broker Server</option>
              {BROKER_SERVERS.map((s) => (
                <option key={s.value} value={s.value} className="bg-black text-white">
                  {s.label}
                </option>
              ))}
              <option value={CUSTOM_VALUE} className="bg-black text-yellow-400">
                ✏ Enter server manually…
              </option>
            </select>

            {/* Custom server text input */}
            {server === CUSTOM_VALUE && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.2 }}
              >
                <input
                  type="text"
                  placeholder="e.g. PepperstoneCroupier-Demo 2"
                  value={customServer}
                  onChange={(e) => setCustomServer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  autoFocus
                  className="w-full bg-[#111] border border-yellow-500/30 rounded-xl px-4 py-3 text-white outline-none
                    focus:border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                />
                <p className="text-[11px] text-gray-600 pl-1 mt-1">
                  Copy the exact server name from your MT5 terminal's login screen.
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Message */}
        {msg.text && (
          <p className={`text-center mt-4 text-sm font-medium ${msgColor}`}>
            {msg.text}
          </p>
        )}

        {/* Authorization failure hints */}
        {showHints && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-red-500/[0.07] border border-red-500/20 rounded-xl px-4 py-4"
          >
            <p className="text-[11px] font-bold text-red-400 uppercase tracking-widest mb-3">
              Authorization Failed — Checklist
            </p>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-red-400 shrink-0 mt-px">1.</span>
                <span>
                  <span className="text-white font-medium">Use the Master (Trading) password</span>, not the
                  Investor (read-only) password. MT5 generates both — check your account confirmation email.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 shrink-0 mt-px">2.</span>
                <span>
                  <span className="text-white font-medium">Verify the exact server name.</span> Open your MT5 terminal →
                  File → Login → and copy the server name exactly. Try "PepperstoneCroupier-Demo" or
                  "PepperstoneCroupier-Demo 2" if "Pepperstone-Demo" fails.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 shrink-0 mt-px">3.</span>
                <span>
                  <span className="text-white font-medium">New demo accounts</span> can take a few minutes to
                  activate after creation. Wait 2–5 minutes and try again.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 shrink-0 mt-px">4.</span>
                <span>
                  Make sure the <span className="text-white font-medium">MT5 terminal is running</span> on the
                  same machine as the bridge server.
                </span>
              </li>
            </ul>
          </motion.div>
        )}

        {/* Submit */}
        <button
          onClick={connectAccount}
          disabled={loading}
          className="w-full mt-6 py-3 rounded-xl bg-yellow-500 text-black font-semibold
            hover:bg-yellow-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed
            flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                  strokeDasharray="40" strokeDashoffset="10" />
              </svg>
              Connecting…
            </>
          ) : (
            "Connect Account →"
          )}
        </button>

        <p className="text-center text-gray-500 text-sm mt-7">
          Institutional-grade encrypted MT5 bridge.
        </p>
      </motion.div>
    </div>
  );
}
