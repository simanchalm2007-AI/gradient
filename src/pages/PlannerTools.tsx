import { useNavigate } from "react-router-dom";
import { AddBlockForm } from "../components/AddBlockForm";
import { ImportHistory } from "../components/ImportHistory";
import { ReminderForm } from "../components/ReminderForm";
import { ScheduleImport } from "../components/ScheduleImport";
import { Timetable } from "../components/Timetable";
import { useDayRecord } from "../lib/storage";
import type { DraftBlock } from "../types";

export function PlannerTools({ mode }: { mode: "daily" | "weekly" | "reminders" }) {
  const navigate = useNavigate();
  const { day, imports, timetable, addBlock, addBlocks, addImport, addReminder, deleteReminder, deleteImport, updateImport, addTimetableEntry, updateTimetableEntry, deleteTimetableEntry, archiveTimetableEntry } = useDayRecord();
  const back = <button type="button" onClick={() => navigate("/")} className="rounded-full border border-line px-3 py-1.5 text-sm text-muted hover:text-ink">← Dashboard</button>;

  function confirmImport(blocks: DraftBlock[], rawText: string) {
    addBlocks(blocks);
    addImport({ rawText, blocks });
  }

  return (
    <main className="mx-auto min-h-screen max-w-[980px] px-5 pb-20 pt-7 sm:px-8">
      <header className="mb-8 flex items-center justify-between border-b border-line pb-4">
        <span className="font-display text-xl font-semibold">Gradient</span>{back}
      </header>
      {mode === "daily" && <section className="rounded-2xl border border-line bg-surface p-5"><h1 className="font-display text-2xl font-semibold">Import daily tasks</h1><p className="mt-1 text-sm text-muted">Parse and review your completed day away from the main dashboard.</p><ScheduleImport onConfirm={confirmImport} /><AddBlockForm onAdd={addBlock} onAddReminder={addReminder} blocks={day.blocks} imports={imports} onApplySuggestion={() => undefined} /><ImportHistory entries={imports} onDelete={deleteImport} onEdit={updateImport} /></section>}
      {mode === "weekly" && <><section className="mb-4 rounded-2xl border border-line bg-surface p-5"><h1 className="font-display text-2xl font-semibold">Edit weekly timetable</h1><p className="mt-1 text-sm text-muted">Click any subject, time, faculty, or room field to correct it directly in the grid.</p></section><Timetable entries={timetable} onAdd={addTimetableEntry} onUpdate={updateTimetableEntry} onDelete={deleteTimetableEntry} onArchive={archiveTimetableEntry} editMode /></>}
      {mode === "reminders" && <section className="rounded-2xl border border-line bg-surface p-5"><h1 className="font-display text-2xl font-semibold">Reminders</h1><p className="mt-1 text-sm text-muted">Create device notifications without crowding the daily dashboard.</p><ReminderForm reminders={day.reminders ?? []} onAdd={addReminder} onDelete={deleteReminder} /></section>}
    </main>
  );
}
