import { useState, useEffect } from "react";
import axios from "axios";

import Loading from "../pages/loading/Loading.jsx";
import Auth from "../pages/Auth.jsx";
import ConnectMT5 from "../pages/mt5/ConnectMT5.jsx";
import Dashboard from "../pages/dashboard/Dashboard.jsx";

function App() {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [mt5Connected, setMt5Connected] = useState(false);

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setMt5Connected(false);
  };

  // After the loading animation, check if user already has an MT5 account
  useEffect(() => {
    if (loading || !token) return;

    setChecking(true);
    axios
      .get("http://localhost:5000/api/mt5/status", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        if (res.data.hasAccounts) setMt5Connected(true);
      })
      .catch(() => {
        // Token invalid or expired — force re-login
        localStorage.clear();
        setToken(null);
      })
      .finally(() => setChecking(false));
  }, [loading]);

  if (loading) {
    return <Loading onFinish={() => setLoading(false)} />;
  }

  if (checking) {
    return null;
  }

  if (!token) {
    return <Auth onLogin={setToken} />;
  }

  if (!mt5Connected) {
    return <ConnectMT5 onSuccess={() => setMt5Connected(true)} />;
  }

  return <Dashboard onLogout={logout} />;
}

export default App;