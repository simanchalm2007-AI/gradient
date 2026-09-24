import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";

export function AuthPage({ onLocalPreview }: { onLocalPreview: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("gradient_theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("gradient_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

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
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin },
          });
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

  async function resetPassword() {
    if (!supabase) {
      setMessage("Password reset requires Supabase cloud login configuration.");
      return;
    }
    if (!email.trim()) {
      setMessage("Enter your email address first.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
      setMessage(error ? error.message : "Password reset instructions sent. Check your email.");
    } catch {
      setMessage("Unable to send reset instructions. Verify your Supabase configuration and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-8">
      <nav className="mx-auto flex max-w-md items-center justify-between border-b border-line pb-4">
        <span className="font-display text-xl font-semibold tracking-tight">Gradient</span>
        <button type="button" onClick={() => setDarkMode((current) => !current)} aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`} className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:border-muted">
          <span aria-hidden="true">{darkMode ? "☀" : "☾"}</span>
          {darkMode ? "Light mode" : "Dark mode"}
        </button>
      </nav>
      <section className="mx-auto mt-12 w-full max-w-md rounded-2xl border border-line bg-surface p-7 shadow-sm">
        <div className="mb-7">
          <h1 className="mt-6 font-display text-3xl font-semibold">{resetMode ? "Reset your password" : mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-2 text-sm text-muted">Sign in to access your schedule on every device.</p>
        </div>
        {!resetMode && <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 outline-none focus:outline-2 focus:outline-amber" placeholder="you@example.com" /></label>
          <label className="block text-sm">Password<input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 outline-none focus:outline-2 focus:outline-amber" placeholder="At least 6 characters" /></label>
          <button disabled={busy} className="w-full rounded-lg bg-amber px-4 py-2.5 font-semibold text-bg disabled:opacity-50">{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
        </form>}
        {resetMode && <div className="space-y-3">
          <p className="text-sm text-muted">Enter your account email and we’ll send you a secure password reset link.</p>
          <button type="button" disabled={busy} onClick={() => void resetPassword()} className="w-full rounded-lg bg-amber px-4 py-2.5 font-semibold text-bg disabled:opacity-50">{busy ? "Sending…" : "Send reset link"}</button>
        </div>}
        {message && <p className={`mt-4 text-sm ${message.includes("sent") ? "text-teal" : "text-flag"}`}>{message}</p>}
        {!resetMode && mode === "login" && <button type="button" onClick={() => { setResetMode(true); setMessage(""); }} className="mt-3 w-full text-sm text-muted underline hover:text-ink">Forgot password?</button>}
        {resetMode && <button type="button" onClick={() => { setResetMode(false); setMessage(""); }} className="mt-4 w-full text-sm text-muted hover:text-ink">Back to log in</button>}
        {!resetMode && <button type="button" onClick={() => setMode((current) => current === "login" ? "signup" : "login")} className="mt-4 w-full text-sm text-muted hover:text-ink">
          {mode === "login" ? "New to Gradient? Create an account" : "Already have an account? Log in"}
        </button>}
        <button type="button" onClick={onLocalPreview} className="mt-5 w-full text-xs text-muted underline">Continue with local preview</button>
      </section>
    </main>
  );
}
