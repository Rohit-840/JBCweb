import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  PencilLine,
  Server,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import api from "../../services/api";
import logo from "../../assets/logo.jpeg";
import { GlassPanel, MotionButton } from "../../components/ui/visual.jsx";

const BROKER_SERVERS = [
  { label: "Pepperstone-Demo", value: "Pepperstone-Demo" },
  { label: "PepperstoneCroupier-Demo", value: "PepperstoneCroupier-Demo" },
  { label: "PepperstoneCroupier-Demo 2", value: "PepperstoneCroupier-Demo 2" },
  { label: "Pepperstone Financial Markets Limited", value: "Pepperstone Financial Markets Limited" },
  { label: "Pepperstone Financial Services L.L.C", value: "Pepperstone Financial Services L.L.C" },
  { label: "Pepperstone Group Limited", value: "Pepperstone Group Limited" },
  { label: "Pepperstone Limited", value: "Pepperstone Limited" },
  { label: "PepperstoneCroupier-Live", value: "PepperstoneCroupier-Live" },
];

const CUSTOM_VALUE = "__custom__";

function FieldIcon({ children }) {
  return (
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-yellow-400/48">
      {children}
    </span>
  );
}

export default function ConnectMT5({ onSuccess, onBack = null }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState("");
  const [customServer, setCustomServer] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "info" });
  const [showHints, setShowHints] = useState(false);
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
        setMsg({ text: "Account already connected. Redirecting...", type: "success" });
      } else {
        setMsg({ text: "MT5 connected successfully.", type: "success" });
      }
      successTimer.current = setTimeout(() => onSuccess(), 1200);
    } catch (err) {
      setLoading(false);
      const raw = err.response?.data?.message || "";

      if (raw.includes("-6") || raw.toLowerCase().includes("auth")) {
        setMsg({ text: "Authorization failed. See tips below.", type: "error" });
        setShowHints(true);
      } else if (raw.includes("-2") || raw.toLowerCase().includes("no connection")) {
        setMsg({
          text: "Cannot reach broker server. Check the server name and your internet connection.",
          type: "error",
        });
      } else {
        setMsg({ text: raw || "Connection failed. Please check your credentials.", type: "error" });
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") connectAccount();
  };

  const msgColor =
    msg.type === "success" ? "text-emerald-400" :
    msg.type === "error" ? "text-red-400" :
    "text-yellow-400";

  useEffect(() => () => {
    clearTimeout(successTimer.current);
  }, []);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-transparent flex items-center justify-center px-4 py-10 relative overflow-y-auto">
      <GlassPanel
        initial={{ opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.58 }}
        className="w-full max-w-md p-7 sm:p-8 relative z-10"
      >
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-2 text-gray-500 hover:text-yellow-400 text-xs transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to accounts
          </button>
        )}

        <div className="flex flex-col items-center mb-8">
          <img
            src={logo}
            alt="JB Crownstone"
            className="w-20 h-20 rounded-full object-cover border border-yellow-500/30 shadow-[0_0_26px_rgba(245,197,66,0.12)]"
          />
          <h1 className="text-3xl text-yellow-400 mt-4 font-semibold">Connect MT5</h1>
          <p className="text-gray-400 mt-2 text-sm tracking-wider uppercase">Secure Trading Integration</p>
        </div>

        <div className="mb-6 bg-yellow-500/[0.07] border border-yellow-500/20 rounded-lg px-4 py-3 text-sm text-yellow-300 flex gap-2.5">
          <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Your credentials are encrypted and securely processed.</span>
        </div>

        <div className="space-y-4">
          <label className="relative block">
            <FieldIcon><UserRound className="h-4 w-4" /></FieldIcon>
            <input
              type="text"
              placeholder="MT5 Login ID"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="ui-input w-full pl-10 pr-4 py-3 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>

          <div className="space-y-1">
            <label className="relative block">
              <FieldIcon><KeyRound className="h-4 w-4" /></FieldIcon>
              <input
                type="password"
                placeholder="MT5 Password (master/trading password)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="ui-input w-full pl-10 pr-4 py-3 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </label>
            <p className="text-[11px] text-gray-600 pl-1">
              Use the <span className="text-yellow-500/70">master trading password</span>, not the investor password.
            </p>
          </div>

          <label className="relative block">
            <FieldIcon><Server className="h-4 w-4" /></FieldIcon>
            <select
              value={server}
              onChange={(e) => { setServer(e.target.value); setShowHints(false); }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="ui-input w-full pl-10 pr-4 py-3 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select Broker Server</option>
              {BROKER_SERVERS.map((s) => (
                <option key={s.value} value={s.value} className="bg-black text-white">
                  {s.label}
                </option>
              ))}
              <option value={CUSTOM_VALUE} className="bg-black text-yellow-400">
                Enter server manually
              </option>
            </select>
          </label>

          {server === CUSTOM_VALUE && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
            >
              <label className="relative block">
                <FieldIcon><PencilLine className="h-4 w-4" /></FieldIcon>
                <input
                  type="text"
                  placeholder="e.g. PepperstoneCroupier-Demo 2"
                  value={customServer}
                  onChange={(e) => setCustomServer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  autoFocus
                  className="ui-input w-full pl-10 pr-4 py-3 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </label>
              <p className="text-[11px] text-gray-600 pl-1 mt-1">
                Copy the exact server name from your MT5 terminal login screen.
              </p>
            </motion.div>
          )}
        </div>

        {msg.text && (
          <p className={`text-center mt-4 text-sm font-medium ${msgColor}`}>
            {msg.type === "success" && <CheckCircle2 className="mr-1.5 inline h-4 w-4" />}
            {msg.type === "error" && <AlertTriangle className="mr-1.5 inline h-4 w-4" />}
            {msg.text}
          </p>
        )}

        {showHints && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-red-500/[0.07] border border-red-500/20 rounded-lg px-4 py-4"
          >
            <p className="text-[11px] font-bold text-red-400 uppercase tracking-widest mb-3">
              Authorization Failed Checklist
            </p>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>1. Use the Master trading password, not the Investor read-only password.</li>
              <li>2. Verify the exact server name from MT5: File, Login, then copy the server name.</li>
              <li>3. New demo accounts can take 2-5 minutes to activate.</li>
              <li>4. Make sure the MT5 terminal is running on the same machine as the bridge server.</li>
            </ul>
          </motion.div>
        )}

        <MotionButton onClick={connectAccount} disabled={loading} className="w-full mt-6 py-3">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              Connect Account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </MotionButton>

        <p className="text-center text-gray-500 text-sm mt-7">
          Institutional-grade encrypted MT5 bridge.
        </p>
      </GlassPanel>
    </div>
  );
}
