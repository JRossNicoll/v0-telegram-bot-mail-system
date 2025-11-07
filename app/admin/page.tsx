"use client";
import React, { useState } from "react";

export default function AdminPage() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>("");

  const setWebhook = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/telegram/set-webhook");
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setResult(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <button
        onClick={setWebhook}
        disabled={busy}
        className="px-4 py-2 rounded-lg border border-black/10 hover:shadow"
      >
        {busy ? "Setting webhook…" : "Set Telegram Webhook"}
      </button>
      {result && (
        <pre className="text-sm p-3 rounded bg-black/5 overflow-auto">{result}</pre>
      )}
    </div>
  );
}
