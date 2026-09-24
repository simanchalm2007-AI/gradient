import { useState, type FormEvent } from "react";
import type { BlockType, ImportedEntry, ScheduleBlock, TaskCategory } from "../types";
import { generateActionableSuggestion, type ActionableSuggestion } from "../lib/suggestions";
import type { Reminder } from "../types";

interface AddBlockFormProps {
  onAdd: (block: Omit<ScheduleBlock, "id" | "done">) => void;
  blocks: ScheduleBlock[];
  imports: ImportedEntry[];
  onApplySuggestion: (suggestion: ActionableSuggestion) => void;
  onAddReminder?: (reminder: Omit<Reminder, "id">) => void;
}

export function AddBlockForm({ onAdd, blocks, imports, onApplySuggestion, onAddReminder }: AddBlockFormProps) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [type, setType] = useState<BlockType>("study");
  const [category, setCategory] = useState<TaskCategory>("college");
  const [reminderAt, setReminderAt] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const draft = { title: title.trim(), start, end, type, category };
  const suggestion = generateActionableSuggestion(draft, blocks, imports, onAdd);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !start || !end) return;
    onAdd(draft);
    if (onAddReminder && reminderAt) onAddReminder({ title: title.trim(), at: reminderAt });
    setTitle("");
    setStart("");
    setEnd("");
    setType("study");
    setCategory("college");
    setReminderAt("");
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-sm text-ink outline-none focus:outline-2 focus:outline-amber";

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-6 gap-2.5 max-[560px]:grid-cols-2">
      <div className="col-span-4 max-[560px]:col-span-2">
        <label className="mb-1 block text-xs text-muted">Completed activity</label>
        <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setDismissed(false); }} placeholder="e.g. Physics revision" required className={inputClass} />
      </div>
      <div><label className="mb-1 block text-xs text-muted">Start</label><input type="time" value={start} onChange={(e) => { setStart(e.target.value); setDismissed(false); }} required className={inputClass} /></div>
      <div><label className="mb-1 block text-xs text-muted">End</label><input type="time" value={end} onChange={(e) => { setEnd(e.target.value); setDismissed(false); }} required className={inputClass} /></div>
      <div><label className="mb-1 block text-xs text-muted">Type</label><select value={type} onChange={(e) => { setType(e.target.value as BlockType); setDismissed(false); }} className={inputClass}><option value="study">Study</option><option value="break">Break</option><option value="exercise">Exercise</option><option value="sleep">Sleep / wind-down</option></select></div>
      <div><label className="mb-1 block text-xs text-muted">Category</label><select value={category} onChange={(e) => { setCategory(e.target.value as TaskCategory); setDismissed(false); }} className={inputClass}><option value="college">College task</option><option value="personal">Personal target</option></select></div>
      <div><label className="mb-1 block text-xs text-muted">Reminder</label><input type="time" value={reminderAt} onChange={(e) => setReminderAt(e.target.value)} className={inputClass} aria-label="Optional reminder time" /></div>
      <div className="flex items-end"><button type="submit" className="w-full rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-bg hover:brightness-110">Add task</button></div>
      {suggestion && !dismissed && (
        <div className="col-span-6 rounded-xl border border-amber/40 bg-amber/10 px-3 py-2 text-xs text-ink max-[560px]:col-span-2">
          {suggestion.message}
          <button type="button" onClick={() => onApplySuggestion(suggestion)} className="ml-3 font-semibold text-amber underline">{suggestion.applyLabel}</button>
          <button type="button" onClick={() => setDismissed(true)} className="ml-3 text-muted underline">Dismiss</button>
        </div>
      )}
    </form>
  );
}
