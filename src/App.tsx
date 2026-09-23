import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { Dashboard } from "./pages/Dashboard";
import { AuthPage } from "./pages/AuthPage";
import { supabase } from "./lib/supabase";
import type { Session } from "@supabase/supabase-js";

// Authentication is intentionally out of scope — every route opens
// straight to the dashboard so the core interface can be reviewed first.
export default function App() {
  const [session, setSession] = useState<Session | { local: true } | null>(null);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);
  const isLocal = session !== null && "local" in session;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={session ? <Dashboard userEmail={isLocal ? undefined : session.user.email} userId={isLocal ? undefined : session.user.id} /> : <AuthPage onLocalPreview={() => setSession({ local: true })} />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
