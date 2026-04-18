import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import logo from "../../assets/logo.jpeg";

export default function ConnectMT5({ onSuccess }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const brokerServers = [
    "Pepperstone Financial Markets Limited",
    "Pepperstone Financial Services L.L.C",
    "Pepperstone Group Limited",
    "Pepperstone Limited",
    "Pepperstone-Demo"
  ];

  const connectAccount = async () => {
    try {
      setLoading(true);
      setMsg("");

      const token = localStorage.getItem("token");

      await axios.post(
        "http://localhost:5000/api/mt5/add",
        {
          login,
          password,
          server
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMsg("MT5 Connected Successfully");

      setTimeout(() => {
        onSuccess();
      }, 1200);

    } catch (err) {
      setMsg(err.response?.data?.message || "Connection Failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-10 relative overflow-hidden">

      {/* Background Glow */}
      <div className="absolute w-[400px] h-[400px] bg-yellow-500/10 blur-3xl rounded-full top-0 left-0" />
      <div className="absolute w-[400px] h-[400px] bg-yellow-500/10 blur-3xl rounded-full bottom-0 right-0" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-md bg-[#0b0b0b] border border-yellow-500/20 rounded-3xl p-8 relative z-10 shadow-[0_0_50px_rgba(255,215,0,0.08)]"
      >

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={logo}
            alt="logo"
            className="w-20 h-20 rounded-full object-cover border border-yellow-500/30"
          />

          <h1 className="text-3xl text-yellow-400 mt-4 font-semibold">
            Connect MT5
          </h1>

          <p className="text-gray-400 mt-2 text-sm tracking-wider uppercase">
            Secure Trading Integration
          </p>
        </div>

        {/* Security Note */}
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
            className="w-full bg-[#111] border border-yellow-500/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500"
          />

          <input
            type="password"
            placeholder="MT5 Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#111] border border-yellow-500/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500"
          />

          <select
            value={server}
            onChange={(e) => setServer(e.target.value)}
            className="w-full bg-[#111] border border-yellow-500/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500"
          >
            <option value="">Select Broker Server</option>

            {brokerServers.map((item, index) => (
              <option key={index} value={item} className="bg-black text-white">
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* Message */}
        {msg && (
          <p className="text-center text-yellow-400 mt-4 text-sm">
            {msg}
          </p>
        )}

        {/* Button */}
        <button
          onClick={connectAccount}
          className="w-full mt-6 py-3 rounded-xl bg-yellow-500 text-black font-semibold hover:scale-[1.02] transition"
        >
          {loading ? "Connecting..." : "Connect Account →"}
        </button>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-7">
          Institutional-grade encrypted MT5 bridge.
        </p>
      </motion.div>
    </div>
  );
}
