import { useState, useEffect, useRef } from "react";

function getDashboardWsUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (import.meta.env.DEV) {
    const target = import.meta.env.VITE_DEV_MT5_TARGET || "http://localhost:8001";
    const url = new URL(target);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws/dashboard";
    url.search = "";
    return url.toString();
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/dashboard`;
}

export default function useWebSocket() {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const equityHistory = useRef([]);
  const socketRef = useRef(null);
  const reconnectTimer = useRef(null);

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(getDashboardWsUrl());
      socketRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();

      ws.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.account?.equity !== undefined) {
            equityHistory.current = [
              ...equityHistory.current.slice(-99),
              { time: Date.now(), equity: parsed.account.equity },
            ];
          }
          setData({ ...parsed, equityHistory: [...equityHistory.current] });
        } catch {
          // non-JSON frame — ignore
        }
      };
    }

    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      socketRef.current?.close();
    };
  }, []);

  return { data, connected };
}
