import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import logo from "../assets/new3.webp";

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setMsg("");

      const url = isLogin
        ? "http://localhost:5000/api/auth/login"
        : "http://localhost:5000/api/auth/signup";

      const payload = isLogin
        ? { email, password }
        : { name, email, password };

      const res = await axios.post(url, payload);

      if (isLogin) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userEmail", res.data.user?.email || email);
        onLogin(res.data.token);
      } else {
        setMsg("Account created successfully.");
        setIsLogin(true);
      }

    } catch (err) {
      setMsg(err.response?.data?.message || "Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-10 relative overflow-hidden">

      {/* Glow Effects */}
      <div className="absolute w-[350px] h-[350px] bg-yellow-500/10 blur-3xl rounded-full top-0 left-0" />
      <div className="absolute w-[350px] h-[350px] bg-yellow-500/10 blur-3xl rounded-full bottom-0 right-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-[#0b0b0b] border border-yellow-500/20 
        rounded-3xl p-8 shadow-[0_0_50px_rgba(255,215,0,0.12)] relative z-10"
      >

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={logo}
            alt="logo"
            className="w-24 h-24 object-cover rounded-full border border-yellow-500/30 shadow-lg"
          />

          <h1 className="mt-4 text-3xl font-semibold text-yellow-400 tracking-wide">
            JB Crownstone
          </h1>

          <p className="text-gray-400 text-sm mt-1 tracking-[0.25em] uppercase">
            Private Client Portal
          </p>
        </div>

        {/* Toggle */}
        <div className="flex bg-[#111] rounded-xl p-1 mb-8 border border-yellow-500/10">
          <button
            onClick={() => setIsLogin(true)}
            className={`w-1/2 py-2 rounded-lg transition ${
              isLogin
                ? "bg-yellow-500 text-black font-semibold"
                : "text-gray-400"
            }`}
          >
            Login
          </button>

          <button
            onClick={() => setIsLogin(false)}
            className={`w-1/2 py-2 rounded-lg transition ${
              !isLogin
                ? "bg-yellow-500 text-black font-semibold"
                : "text-gray-400"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Heading */}
        <div className="mb-6 text-center">
          <h2 className="text-white text-3xl font-semibold">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>

          <p className="text-gray-400 mt-2">
            {isLogin
              ? "Sign in to access your dashboard"
              : "Join the premium client portal"}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">

          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              className="w-full bg-[#101010] border border-yellow-500/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            className="w-full bg-[#101010] border border-yellow-500/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full bg-[#101010] border border-yellow-500/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Message */}
        {msg && (
          <p className="text-center text-sm text-yellow-400 mt-4">
            {msg}
          </p>
        )}

        {/* Button */}
        <button
          onClick={handleSubmit}
          className="w-full mt-6 py-3 rounded-xl bg-yellow-500 text-black font-semibold hover:scale-[1.02] transition"
        >
          {loading
            ? "Please wait..."
            : isLogin
            ? "Login →"
            : "Create Account →"}
        </button>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Protected by enterprise-grade encryption.
        </p>
      </motion.div>
    </div>
  );
}