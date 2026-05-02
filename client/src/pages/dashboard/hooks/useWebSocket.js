import { useState, useEffect, useRef } from "react";

function getDashboardWsUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  if (import.meta.env.DEV) {
    return `${protocol}//${window.location.host}/ws/dashboard`;
  }

  return `${protocol}//${window.location.host}/ws/dashboard`;
}

export default function useWebSocket() {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const equityHistory = useRef([]);
  const socketRef = useRef(null);
  const reconnectTimer = useRef(null);
  const animationFrame = useRef(null);
  const pendingFrame = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;

    const flushPendingFrame = () => {
      animationFrame.current = null;
      if (!pendingFrame.current || !mounted.current) return;
      setData(pendingFrame.current);
      pendingFrame.current = null;
    };

    function connect() {
      const ws = new WebSocket(getDashboardWsUrl());
      socketRef.current = ws;

      ws.onopen = () => {
        if (!mounted.current || socketRef.current !== ws) return;
        setConnected(true);
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      };

      ws.onclose = () => {
        if (!mounted.current || socketRef.current !== ws) return;
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
          pendingFrame.current = { ...parsed, equityHistory: [...equityHistory.current] };
          if (!animationFrame.current) {
            animationFrame.current = requestAnimationFrame(flushPendingFrame);
          }
        } catch {
          // non-JSON frame — ignore
        }
      };
    }

    connect();
    return () => {
      mounted.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      socketRef.current?.close();
    };
  }, []);

  return { data, connected };
}
