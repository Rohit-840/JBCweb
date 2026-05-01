import { useState, useEffect } from "react";

import Loading         from "../pages/loading/Loading.jsx";
import Auth            from "../pages/Auth.jsx";
import ConnectMT5      from "../pages/mt5/ConnectMT5.jsx";
import AccountSelector from "../pages/accounts/AccountSelector.jsx";
import Dashboard       from "../pages/dashboard/Dashboard.jsx";
import AppBackground   from "../components/AppBackground.jsx";
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

  useEffect(() => {
    if (loading || !token) return;

    setChecking(true);
    api
      .get("/mt5/status", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .catch(() => {
        localStorage.clear();
        setToken(null);
      })
      .finally(() => setChecking(false));
  }, [loading, token]);

  const renderApp = () => {
    if (checking) return null;
    if (!token) return <Auth onLogin={setToken} />;

    if (addingAccount) {
      return (
        <ConnectMT5
          onSuccess={() => setAddingAccount(false)}
          onBack={() => setAddingAccount(false)}
        />
      );
    }

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
  };

  if (loading) return <Loading onFinish={handleLoadingFinish} />;

  const backgroundVariant = token && accountSelected && !addingAccount ? "dashboard" : "front";

  return (
    <div className={`app-shell app-shell--${backgroundVariant}`}>
      <AppBackground variant={backgroundVariant} />
      <div className="app-shell__content">
        {renderApp()}
      </div>
    </div>
  );
}

export default App;
