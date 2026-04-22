import { useState, useEffect } from "react";
import axios from "axios";

import Loading         from "../pages/loading/Loading.jsx";
import Auth            from "../pages/Auth.jsx";
import ConnectMT5      from "../pages/mt5/ConnectMT5.jsx";
import AccountSelector from "../pages/accounts/AccountSelector.jsx";
import Dashboard       from "../pages/dashboard/Dashboard.jsx";

function App() {
  const [loading,         setLoading]         = useState(true);
  const [checking,        setChecking]         = useState(false);
  const [token,           setToken]           = useState(localStorage.getItem("token"));
  const [addingAccount,   setAddingAccount]   = useState(false);
  const [accountSelected, setAccountSelected] = useState(false);

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setAccountSelected(false);
    setAddingAccount(false);
  };

  // After the splash screen, verify the JWT is still valid.
  useEffect(() => {
    if (loading || !token) return;

    setChecking(true);
    axios
      .get("http://localhost:5000/api/mt5/status", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .catch(() => {
        // Token invalid or expired — force re-login
        localStorage.clear();
        setToken(null);
      })
      .finally(() => setChecking(false));
  }, [loading]);

  // ── Render tree ──────────────────────────────────────────────────────────────
  if (loading)  return <Loading onFinish={() => setLoading(false)} />;
  if (checking) return null;
  if (!token)   return <Auth onLogin={setToken} />;

  // Adding an account (launched from AccountSelector) — always has a back button
  if (addingAccount) {
    return (
      <ConnectMT5
        onSuccess={() => setAddingAccount(false)}
        onBack={() => setAddingAccount(false)}
      />
    );
  }

  // After login, every user lands here — handles 0 or more accounts gracefully
  if (!accountSelected) {
    return (
      <AccountSelector
        token={token}
        onSelect={() => setAccountSelected(true)}
        onAddAccount={() => setAddingAccount(true)}
        onLogout={logout}
      />
    );
  }

  return (
    <Dashboard
      onLogout={logout}
      onSwitchAccount={() => setAccountSelected(false)}
    />
  );
}

export default App;
