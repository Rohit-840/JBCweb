import { useState, useEffect } from "react";

import Loading         from "../pages/loading/Loading.jsx";
import Auth            from "../pages/Auth.jsx";
import ConnectMT5      from "../pages/mt5/ConnectMT5.jsx";
import AccountSelector from "../pages/accounts/AccountSelector.jsx";
import Dashboard       from "../pages/dashboard/Dashboard.jsx";
import api             from "../services/api.js";

function App() {
  const [loading,         setLoading]         = useState(!sessionStorage.getItem("hasSeenLoading"));
  const [checking,        setChecking]         = useState(false);
  const [token,           setToken]           = useState(localStorage.getItem("token"));
  const [addingAccount,   setAddingAccount]   = useState(false);
  const [accountSelected, setAccountSelected] = useState(localStorage.getItem("accountSelected") === "true");

  const logout = () => {
    localStorage.clear();
    sessionStorage.removeItem("hasSeenLoading");
    setToken(null);
    setAccountSelected(false);
    setAddingAccount(false);
  };

  const handleLoadingFinish = () => {
    sessionStorage.setItem("hasSeenLoading", "true");
    setLoading(false);
  };

  // after the splash screen, verify the jwt is still valid.
  useEffect(() => {
    if (loading || !token) return;

    setChecking(true);
    api
      .get("/mt5/status", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .catch(() => {
        // Token invalid or expired — force re-login
        localStorage.clear();
        setToken(null);
      })
      .finally(() => setChecking(false));
  }, [loading, token]);

  // Render tree 
  if (loading)  return <Loading onFinish={handleLoadingFinish} />;
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

  // After login, every user lands here, handles 0 or more accounts gracefully
  if (!accountSelected) {
    return (
      <AccountSelector
        token={token}
        onSelect={() => {
          localStorage.setItem("accountSelected", "true");
          setAccountSelected(true);
        }}
        onAddAccount={() => setAddingAccount(true)}
        onLogout={logout}
      />
    );
  }

  return (
    <Dashboard
      onLogout={logout}
      onSwitchAccount={() => {
        localStorage.removeItem("accountSelected");
        setAccountSelected(false);
      }}
    />
  );
}

export default App;
