const MT5_BASE_URL = import.meta.env.VITE_MT5_BASE_URL || "";

export async function mt5Post(path, body) {
  const res = await fetch(`${MT5_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}
