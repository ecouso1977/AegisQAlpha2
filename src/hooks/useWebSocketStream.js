import { useState, useEffect, useRef, useCallback } from "react";

/**
 * useWebSocketStream
 * Connects to a WebSocket URL and streams lines into `lines`.
 * Falls back to simulated output when no real WS server is available.
 *
 * @param {string|null} url       - ws:// or wss:// endpoint, or null to disconnect
 * @param {string[]}    fallback  - Lines to stream when WS is unavailable (demo mode)
 * @param {object}      opts
 * @param {number}      opts.reconnectDelay  - ms before reconnect attempt (default 3000)
 * @param {number}      opts.fallbackDelay   - ms between fallback lines (default 750)
 */
export function useWebSocketStream(url, fallback = [], opts = {}) {
  const { reconnectDelay = 3000, fallbackDelay = 750 } = opts;

  const [lines, setLines] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | connecting | open | closed | error | simulated
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const fallbackRef = useRef(null);

  const clearTimers = () => {
    clearTimeout(reconnectRef.current);
    clearInterval(fallbackRef.current);
  };

  const runFallback = useCallback(() => {
    setStatus("simulated");
    let i = 0;
    setLines([]);
    fallbackRef.current = setInterval(() => {
      if (i >= fallback.length) {
        clearInterval(fallbackRef.current);
        return;
      }
      setLines((prev) => [...prev, fallback[i++]]);
    }, fallbackDelay);
  }, [fallback, fallbackDelay]);

  const connect = useCallback(() => {
    if (!url) return;

    clearTimers();
    setStatus("connecting");

    let ws;
    try {
      ws = new WebSocket(url);
    } catch {
      runFallback();
      return;
    }

    ws.onopen = () => {
      setStatus("open");
      setLines([]);
    };

    ws.onmessage = (evt) => {
      // Each message may be a single line or newline-delimited batch
      const text = typeof evt.data === "string" ? evt.data : "";
      const incoming = text.split("\n").filter(Boolean);
      setLines((prev) => [...prev, ...incoming]);
    };

    ws.onerror = () => {
      setStatus("error");
    };

    ws.onclose = (evt) => {
      setStatus("closed");
      // If not a clean close (code 1000) and we still have a url, reconnect
      if (evt.code !== 1000 && url) {
        // Try fallback if WS never opened (likely no server)
        if (evt.code === 1006) {
          runFallback();
          return;
        }
        reconnectRef.current = setTimeout(connect, reconnectDelay);
      }
    };

    wsRef.current = ws;
  }, [url, reconnectDelay, runFallback]);

  useEffect(() => {
    if (!url) {
      wsRef.current?.close(1000);
      clearTimers();
      setStatus("idle");
      setLines([]);
      return;
    }
    connect();
    return () => {
      wsRef.current?.close(1000);
      clearTimers();
    };
  }, [url]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === "string" ? data : JSON.stringify(data));
    }
  }, []);

  const reset = useCallback(() => {
    setLines([]);
  }, []);

  return { lines, status, send, reset };
}