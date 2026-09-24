import { useEffect, useMemo, useState } from "react";
import { useDayRecord } from "../lib/storage";
import { durationMinutes, generateRoutineSuggestions, generateSuggestions, formatDuration, type ActionableSuggestion } from "../lib/suggestions";
import { ScheduleTimeline } from "../components/ScheduleTimeline";
import { AddBlockForm } from "../components/AddBlockForm";
import { CheckInForm } from "../components/CheckInForm";
import { ProgressRing } from "../components/ProgressRing";
import { Suggestions } from "../components/Suggestions";
import { supabase } from "../lib/supabase";
import { ImportHistory } from "../components/ImportHistory";
import { Assistant } from "../components/Assistant";
import { Timetable } from "../components/Timetable";
import { AttendanceSummary } from "../components/AttendanceSummary";
import { DailyActivityChart } from "../components/DailyActivityChart";

export function Dashboard({ userEmail, userId }: { userEmail?: string; userId?: string }) {
  const { day, imports, activityHistory, attendanceRecords, timetable, attendanceTarget, addBlock, toggleBlock, deleteBlock, updateBlock, replaceBlocks, saveCheckin, addReminder, deleteImport, updateImport, addTimetableEntry, deleteTimetableEntry, archiveTimetableEntry, setAttendance, setAttendanceTarget, streak, saveState, retrySave } = useDayRecord(userId);
  const [dismissedError, setDismissedError] = useState(false);
  const [undoBlocks, setUndoBlocks] = useState<null | typeof day.blocks>(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("gradient_theme");
    return stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("gradient_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

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
  const applySuggestion = (suggestion: ActionableSuggestion) => {
    setUndoBlocks(day.blocks);
    suggestion.apply();
  };
  const layoutClass = "grid grid-cols-1 gap-5 md:grid-cols-[1.15fr_0.85fr] lg:grid-cols-12";
  const primaryClass = "lg:col-span-8";
  const sidebarClass = "lg:col-span-4";
  const collegeBlocks = day.blocks.filter((block) => (block.category ?? "college") === "college");
  const personalBlocks = day.blocks.filter((block) => block.category === "personal");
  const totalSuggestions = tips.length + routineTips.length;
  const dailySummary = day.blocks.length === 0
    ? "No completed work logged yet. Add a college task or personal target to start your day summary."
    : `${doneCount} of ${day.blocks.length} tasks complete (${percent}%). ${collegeBlocks.length > personalBlocks.length ? "College workload is leading today; protect a short personal reset." : personalBlocks.length > collegeBlocks.length ? "Personal targets are leading today; reserve time for college priorities." : "College and personal work are balanced today."}`;

  return (
    <div className="mx-auto max-w-[1500px] px-5 pb-20 pt-7 sm:px-8 lg:px-10">
      <nav className="relative mb-8 flex items-center justify-between border-b border-line pb-4" aria-label="Primary navigation">
        <span className="font-display text-xl font-semibold tracking-tight">Gradient</span>
        <div className="flex items-center gap-2">
          {userEmail && <span className="hidden text-xs text-muted sm:inline">{userEmail}</span>}
          {userEmail && <button type="button" onClick={() => supabase?.auth.signOut()} className="rounded-full border border-line px-3 py-1.5 text-xs text-muted hover:text-ink">Log out</button>}
          <button type="button" onClick={() => setDarkMode((current) => !current)} aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`} className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:border-muted"><span aria-hidden="true">{darkMode ? "☀" : "☾"}</span>{darkMode ? "Light mode" : "Dark mode"}</button>
          <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Open actions menu" aria-expanded={menuOpen} className="grid h-9 w-9 grid-cols-3 grid-rows-3 gap-0.5 rounded-lg border border-line bg-surface p-2 text-ink">
            {Array.from({ length: 9 }, (_, index) => <span key={index} className="h-1 w-1 rounded-full bg-current" />)}
          </button>
          {menuOpen && <div className="absolute right-0 top-12 z-20 w-60 rounded-xl border border-line bg-surface p-2 shadow-xl">
            <button type="button" onClick={() => { setMenuOpen(false); window.location.assign("/tools/weekly"); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2">Import Weekly Schedule (PDF parser)</button>
            <button type="button" onClick={() => { setMenuOpen(false); window.location.assign("/tools/daily"); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2">Import Daily Tasks</button>
            <button type="button" onClick={() => { setMenuOpen(false); window.location.assign("/tools/reminders"); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2">Add Reminder</button>
          </div>}
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

      <DailyActivityChart points={activityHistory} />
      {!online && <div className="mb-4 rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm">You are offline. Your changes are saved on this device and will retry when you reconnect.</div>}
      <div className={layoutClass}>
        <div className={primaryClass}>
          <section id="schedule" className="rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="flex items-center gap-2 font-display text-xl font-semibold">Complete today {saveState === "saved" && <span className="text-xs font-sans font-normal text-teal">✓ saved</span>}</h2><p className="mt-1 text-xs text-muted">Capture finished work and balance college priorities with personal targets.</p></div><span className="rounded-full bg-amber/10 px-3 py-1 text-xs font-semibold text-amber">{percent}% complete</span></div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-line bg-surface-2 p-4"><h3 className="font-display font-semibold">College Tasks <span className="text-xs font-normal text-muted">({collegeBlocks.length})</span></h3><ScheduleTimeline blocks={collegeBlocks} onToggle={toggleBlock} onDelete={deleteBlock} onEdit={updateBlock} imports={imports} onApplySuggestion={applySuggestion} /></div>
              <div className="rounded-xl border border-line bg-surface-2 p-4"><h3 className="font-display font-semibold">Personal Targets <span className="text-xs font-normal text-muted">({personalBlocks.length})</span></h3><ScheduleTimeline blocks={personalBlocks} onToggle={toggleBlock} onDelete={deleteBlock} onEdit={updateBlock} imports={imports} onApplySuggestion={applySuggestion} /></div>
            </div>
            <AddBlockForm onAdd={addBlock} onAddReminder={addReminder} blocks={day.blocks} imports={imports} onApplySuggestion={applySuggestion} />
          </section>
          <div className="desktop-feature-grid">
            <Timetable entries={timetable} onAdd={addTimetableEntry} onDelete={deleteTimetableEntry} onArchive={archiveTimetableEntry} />
            <ImportHistory entries={imports} onDelete={deleteImport} onEdit={updateImport} />
            <section id="check-in" className="mt-5 rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-sm">
              <h2 className="font-display text-lg font-semibold">Evening check-in</h2>
              <div className="mt-3.5">
                <CheckInForm value={day.checkin} onSave={saveCheckin} />
              </div>
            </section>
          </div>
        </div>

        <aside className={sidebarClass}>
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">Daily summary</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{dailySummary}</p>
            <p className="mt-3 rounded-lg bg-amber/10 px-3 py-2 text-xs text-ink"><strong>AI workload manager:</strong> {collegeBlocks.length > personalBlocks.length ? "Try one personal target after your next college block." : personalBlocks.length > collegeBlocks.length ? "Schedule one focused college block before adding more personal work." : "Keep alternating categories to maintain balance."}</p>
          </section>
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
            <h2 className="font-display text-lg font-semibold">Attendance at a glance</h2>
            <AttendanceSummary entries={timetable} records={attendanceRecords} target={attendanceTarget} onSet={setAttendance} onTarget={setAttendanceTarget} compact />
          </section>
          <section className="mt-5 rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">Suggestions for you</h2>
            <Suggestions tips={tips} />
          </section>
          <section id="total-suggestions" className="mt-5 rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between gap-2"><h2 className="font-display text-lg font-semibold">Total suggestions</h2><span className="rounded-full bg-amber/10 px-2.5 py-1 text-xs font-semibold text-amber">{totalSuggestions}</span></div>
            <p className="mt-1 text-xs text-muted">All current recommendations from your activity and routine history.</p>
            <Suggestions tips={[...tips, ...routineTips]} />
          </section>
          {undoBlocks && <div className="mt-5 rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm">Suggestion applied.<button type="button" onClick={() => { void replaceBlocks(undoBlocks); setUndoBlocks(null); }} className="ml-3 font-semibold text-amber underline">Undo</button><button type="button" onClick={() => setUndoBlocks(null)} className="ml-3 text-muted">Dismiss</button></div>}
          <section className="mt-5 rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">Routine insights</h2>
            <Suggestions tips={routineTips} />
          </section>
        </aside>
      </div>

      {(saveState === "saving" || saveState === "saved" || (saveState === "error" && !dismissedError)) && (
        <div className={`fixed bottom-5 right-5 z-10 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${saveState === "error" ? "border-flag/40 bg-flag/10 text-flag" : "border-line bg-surface"} ${saveState === "saved" ? "save-toast" : ""}`}>
          {saveState === "saving" && "Saving…"}
          {saveState === "saved" && "✓ Saved"}
          {saveState === "error" && <><span>Failed to save</span><button type="button" onClick={() => { setDismissedError(false); void retrySave(); }} className="font-semibold underline">Retry</button><button type="button" aria-label="Dismiss save notification" onClick={() => setDismissedError(true)} className="text-muted">×</button></>}
        </div>
      )}
      <footer className="mt-8 text-center text-xs text-muted">{userEmail ? "Your signed-in data syncs securely across devices." : "Data stays on this device only."}</footer>
      <Assistant onNavigate={(target) => document.getElementById(target)?.scrollIntoView({ behavior: "smooth" })} />
    </div>
  );
}
