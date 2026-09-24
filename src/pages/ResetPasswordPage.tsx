import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setMessage("Cloud login is not configured.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    setMessage(error ? error.message : "Password updated. You can now log in with your new password.");
    setBusy(false);
    if (!error) setTimeout(() => navigate("/"), 1200);
  }

  return (
    <main className="min-h-screen px-5 py-8">
      <section className="mx-auto mt-12 w-full max-w-md rounded-2xl border border-line bg-surface p-7 shadow-sm">
        <h1 className="font-display text-3xl font-semibold">Choose a new password</h1>
        <p className="mt-2 text-sm text-muted">Use at least six characters for your new Gradient password.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm">New password<input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 outline-none focus:outline-2 focus:outline-amber" /></label>
          <button disabled={busy} className="w-full rounded-lg bg-amber px-4 py-2.5 font-semibold text-bg disabled:opacity-50">{busy ? "Updating…" : "Update password"}</button>
        </form>
        {message && <p className={`mt-4 text-sm ${message.startsWith("Password updated") ? "text-teal" : "text-flag"}`}>{message}</p>}
      </section>
    </main>
  );
}
