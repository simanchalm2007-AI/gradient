import { useEffect, useMemo, useState } from "react";
import { useDayRecord } from "../lib/storage";
import { durationMinutes, generateRoutineSuggestions, generateSuggestions, formatDuration } from "../lib/suggestions";
import { ScheduleTimeline } from "../components/ScheduleTimeline";
import { AddBlockForm } from "../components/AddBlockForm";
import { CheckInForm } from "../components/CheckInForm";
import { ProgressRing } from "../components/ProgressRing";
import { Suggestions } from "../components/Suggestions";
import { ScheduleImport } from "../components/ScheduleImport";
import { supabase } from "../lib/supabase";
import { ReminderForm } from "../components/ReminderForm";
import { ImportHistory } from "../components/ImportHistory";

export function Dashboard({ userEmail, userId }: { userEmail?: string; userId?: string }) {
  const { day, imports, addBlock, addBlocks, toggleBlock, deleteBlock, saveCheckin, addReminder, deleteReminder, addImport, deleteImport, streak, saveState, retrySave } = useDayRecord(userId);
  const [dismissedError, setDismissedError] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("gradient_theme");
    return stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("gradient_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const timers = (day.reminders ?? []).map((reminder) => {
      const [hours, minutes] = reminder.at.split(":").map(Number);
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);
      const delay = target.getTime() - Date.now();
      if (delay <= 0 || delay > 24 * 60 * 60 * 1000 || !("Notification" in window) || Notification.permission !== "granted") return undefined;
      return window.setTimeout(() => new Notification("Gradient reminder", { body: reminder.title }), delay);
    }).filter((timer): timer is number => timer !== undefined);
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [day.reminders]);

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
  const routineTips = useMemo(
    () => generateRoutineSuggestions(imports, day.blocks, streak()),
    [imports, day.blocks, streak],
  );
  const confirmImport = (blocks: Array<Omit<import("../types").ScheduleBlock, "id" | "done">>, rawText: string) => {
    addBlocks(blocks);
    addImport({ rawText, blocks });
  };

  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-20 pt-7 sm:px-8 lg:px-10">
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

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.15fr_0.85fr] lg:grid-cols-[1.3fr_1fr]">
        <div>
          <section id="schedule" className="rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-sm">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">Completed today {saveState === "saved" && <span className="text-xs font-sans font-normal text-teal">✓ saved</span>}</h2>
            <p className="mt-1 text-xs text-muted">Log what you actually completed at the end of your day.</p>
            <ScheduleImport onConfirm={confirmImport} />
            <ScheduleTimeline blocks={day.blocks} onToggle={toggleBlock} onDelete={deleteBlock} />
            <AddBlockForm onAdd={addBlock} />
            <ReminderForm reminders={day.reminders ?? []} onAdd={addReminder} onDelete={deleteReminder} />
          </section>
          <ImportHistory entries={imports} onDelete={deleteImport} />

          <section id="check-in" className="mt-5 rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-sm">
            <h2 className="font-display text-lg font-semibold">Evening check-in</h2>
            <div className="mt-3.5">
              <CheckInForm value={day.checkin} onSave={saveCheckin} />
            </div>
          </section>
        </div>

        <div>
          <section id="progress" className="rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-sm">
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
          <section className="mt-5 rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">Routine insights</h2>
            <Suggestions tips={routineTips} />
          </section>
        </div>
      </div>

      {(saveState === "saving" || saveState === "saved" || (saveState === "error" && !dismissedError)) && (
        <div className={`fixed bottom-5 right-5 z-10 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${saveState === "error" ? "border-flag/40 bg-flag/10 text-flag" : "border-line bg-surface"} ${saveState === "saved" ? "save-toast" : ""}`}>
          {saveState === "saving" && "Saving…"}
          {saveState === "saved" && "✓ Saved"}
          {saveState === "error" && <><span>Failed to save</span><button type="button" onClick={() => { setDismissedError(false); void retrySave(); }} className="font-semibold underline">Retry</button><button type="button" aria-label="Dismiss save notification" onClick={() => setDismissedError(true)} className="text-muted">×</button></>}
        </div>
      )}
      <footer className="mt-8 text-center text-xs text-muted">{userEmail ? "Your signed-in data syncs securely across devices." : "Data stays on this device only."}</footer>
    </div>
  );
}
