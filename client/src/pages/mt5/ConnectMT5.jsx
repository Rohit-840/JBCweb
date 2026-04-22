import { useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import logo from "../../assets/logo.jpeg";

const BROKER_SERVERS = [
  "Pepperstone Financial Markets Limited",
  "Pepperstone Financial Services L.L.C",
  "Pepperstone Group Limited",
  "Pepperstone Limited",
  "Pepperstone-Demo",
];

export default function ConnectMT5({ onSuccess, onBack = null }) {
  const [login,    setLogin]    = useState("");
  const [password, setPassword] = useState("");
  const [server,   setServer]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState({ text: "", type: "info" });

  const connectAccount = async () => {
    // ── Input validation ────────────────────────────────────────────────────
    if (!login.trim()) {
      setMsg({ text: "Please enter your MT5 Login ID.", type: "error" });
      return;
    }
    if (!password.trim()) {
      setMsg({ text: "Please enter your MT5 Password.", type: "error" });
      return;
    }
    if (!server) {
      setMsg({ text: "Please select a broker server.", type: "error" });
      return;
    }

    setLoading(true);
    setMsg({ text: "", type: "info" });

    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/mt5/add",
        { login, password, server },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.alreadyConnected) {
        // Account exists — treat it as success, user can still proceed
        setMsg({ text: "Account already connected. Redirecting…", type: "success" });
      } else {
        setMsg({ text: "MT5 Connected Successfully!", type: "success" });
      }

      // Keep loading=true so the button stays disabled during the delay
      setTimeout(() => onSuccess(), 1200);

    } catch (err) {
      setLoading(false);
      setMsg({ text: err.response?.data?.message || "Connection failed. Check your credentials.", type: "error" });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      connectAccount();
    }
  };

  const msgColor =
    msg.type === "success" ? "text-emerald-400" :
    msg.type === "error"   ? "text-red-400"     :
    "text-yellow-400";

  return (
    <div className="min-h-screen min-h-[100dvh] bg-black flex items-center justify-center px-4 py-10 relative overflow-y-auto">

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
          <img
            src={logo}
            alt="logo"
            className="w-20 h-20 rounded-full object-cover border border-yellow-500/30"
          />
          <h1 className="text-3xl text-yellow-400 mt-4 font-semibold">Connect MT5</h1>
          <p className="text-gray-400 mt-2 text-sm tracking-wider uppercase">
            Secure Trading Integration
          </p>
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

          <input
            type="password"
            placeholder="MT5 Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="w-full bg-[#111] border border-yellow-500/10 rounded-xl px-4 py-3 text-white outline-none
              focus:border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />

          <select
            value={server}
            onChange={(e) => setServer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="w-full bg-[#111] border border-yellow-500/10 rounded-xl px-4 py-3 text-white outline-none
              focus:border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <option value="">Select Broker Server</option>
            {BROKER_SERVERS.map((s) => (
              <option key={s} value={s} className="bg-black text-white">{s}</option>
            ))}
          </select>
        </div>

        {/* Message */}
        {msg.text && (
          <p className={`text-center mt-4 text-sm font-medium ${msgColor}`}>
            {msg.text}
          </p>
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
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" />
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
