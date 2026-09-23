import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";

export function AuthPage({ onLocalPreview }: { onLocalPreview: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setMessage("Cloud login is not configured yet. Add the Supabase environment variables from README.md.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
      if (result.error) setMessage(result.error.message);
      else if (mode === "signup") setMessage("Account created. Check your email to confirm it, then log in.");
    } catch {
      setMessage(
        "Unable to reach Supabase. In Netlify, verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy the site.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-line bg-surface p-7 shadow-sm">
        <div className="mb-7">
          <div className="font-display text-2xl font-semibold">Gradient</div>
          <h1 className="mt-6 font-display text-3xl font-semibold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-2 text-sm text-muted">Sign in to access your schedule on every device.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 outline-none focus:outline-2 focus:outline-amber" placeholder="you@example.com" /></label>
          <label className="block text-sm">Password<input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 outline-none focus:outline-2 focus:outline-amber" placeholder="At least 6 characters" /></label>
          {message && <p className="text-sm text-flag">{message}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-amber px-4 py-2.5 font-semibold text-bg disabled:opacity-50">{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
        </form>
        <button type="button" onClick={() => setMode((current) => current === "login" ? "signup" : "login")} className="mt-4 w-full text-sm text-muted hover:text-ink">
          {mode === "login" ? "New to Gradient? Create an account" : "Already have an account? Log in"}
        </button>
        <button type="button" onClick={onLocalPreview} className="mt-5 w-full text-xs text-muted underline">Continue with local preview</button>
      </section>
    </main>
  );
}
