import { useEffect, useMemo, useState } from "react";
import { useDayRecord } from "../lib/storage";
import { durationMinutes, generateSuggestions, formatDuration } from "../lib/suggestions";
import { ScheduleTimeline } from "../components/ScheduleTimeline";
import { AddBlockForm } from "../components/AddBlockForm";
import { CheckInForm } from "../components/CheckInForm";
import { ProgressRing } from "../components/ProgressRing";
import { Suggestions } from "../components/Suggestions";
import { ScheduleImport } from "../components/ScheduleImport";
import { supabase } from "../lib/supabase";

export function Dashboard({ userEmail, userId }: { userEmail?: string; userId?: string }) {
  const { day, addBlock, addBlocks, toggleBlock, deleteBlock, saveCheckin, streak } = useDayRecord(userId);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("gradient_theme");
    return stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("gradient_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const dateLabel = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }),
    [],
  );

  const doneCount = day.blocks.filter((b) => b.done).length;
  const percent = day.blocks.length ? Math.round((doneCount / day.blocks.length) * 100) : 0;
  const focusMin = day.blocks
    .filter((b) => b.type === "study")
    .reduce((s, b) => s + durationMinutes(b.start, b.end), 0);
  const breakMin = day.blocks
    .filter((b) => b.type === "break")
    .reduce((s, b) => s + durationMinutes(b.start, b.end), 0);

  const tips = useMemo(() => generateSuggestions(day.blocks, day.checkin), [day.blocks, day.checkin]);

  return (
    <div className="mx-auto max-w-[900px] px-5 pb-20 pt-7">
      <nav className="mb-8 flex items-center justify-between border-b border-line pb-4" aria-label="Primary navigation">
        <span className="font-display text-xl font-semibold tracking-tight">Gradient</span>
        <div className="flex items-center gap-2">
          {userEmail && <span className="hidden text-xs text-muted sm:inline">{userEmail}</span>}
          {userEmail && <button type="button" onClick={() => supabase?.auth.signOut()} className="rounded-full border border-line px-3 py-1.5 text-xs text-muted hover:text-ink">Log out</button>}
          <button type="button" onClick={() => setDarkMode((current) => !current)} aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`} className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:border-muted"><span aria-hidden="true">{darkMode ? "☀" : "☾"}</span>{darkMode ? "Light mode" : "Dark mode"}</button>
        </div>
      </nav>

      <header className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[clamp(28px,5vw,38px)] font-semibold tracking-tight">Your day, in gradient</h1>
          <div className="mt-1 text-sm text-muted">{dateLabel}</div>
        </div>
        <div className="whitespace-nowrap rounded-full border border-line bg-surface px-4 py-2 text-sm text-amber">
          🔥 {streak()}-day streak
        </div>
      </header>

      <div className="grid grid-cols-[1.3fr_1fr] gap-5 max-[720px]:grid-cols-1">
        <div>
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">Today's schedule</h2>
            <ScheduleImport onAdd={addBlocks} />
            <ScheduleTimeline blocks={day.blocks} onToggle={toggleBlock} onDelete={deleteBlock} />
            <AddBlockForm onAdd={addBlock} />
          </section>

          <section className="mt-5 rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">Evening check-in</h2>
            <div className="mt-3.5">
              <CheckInForm value={day.checkin} onSave={saveCheckin} />
            </div>
          </section>
        </div>

        <div>
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">Today's progress</h2>
            <div className="mt-3.5 flex items-center gap-5">
              <ProgressRing percent={percent} />
              <div className="flex-1">
                <div className="flex justify-between border-b border-line py-1.5 text-sm">
                  <span>Blocks completed</span>
                  <span className="text-muted">
                    {doneCount} / {day.blocks.length}
                  </span>
                </div>
                <div className="flex justify-between border-b border-line py-1.5 text-sm">
                  <span>Focus time</span>
                  <span className="text-muted">{formatDuration(focusMin)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-sm">
                  <span>Break time</span>
                  <span className="text-muted">{formatDuration(breakMin)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">Suggestions for you</h2>
            <Suggestions tips={tips} />
          </section>
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-muted">{userEmail ? "Your signed-in data syncs securely across devices." : "Data stays on this device only."}</footer>
    </div>
  );
}
