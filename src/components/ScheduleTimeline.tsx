import { useState } from "react";
import type { BlockType, ScheduleBlock } from "../types";
import type { ImportedEntry } from "../types";
import { durationMinutes, formatDuration, generateActionableSuggestion, type ActionableSuggestion } from "../lib/suggestions";

interface ScheduleTimelineProps {
  blocks: ScheduleBlock[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, patch: Partial<Omit<ScheduleBlock, "id">>) => void;
  imports: ImportedEntry[];
  onApplySuggestion: (suggestion: ActionableSuggestion) => void;
}

const TYPE_LABEL: Record<BlockType, string> = { study: "Study", break: "Break", exercise: "Exercise", sleep: "Sleep / wind-down" };
const TYPE_BAR: Record<BlockType, string> = { study: "bg-amber", break: "bg-violet", exercise: "bg-teal", sleep: "bg-[#5b6199]" };
const toMinutes = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const formatTime = (t: string) => { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };

export function ScheduleTimeline({ blocks, onToggle, onDelete, onEdit, imports, onApplySuggestion }: ScheduleTimelineProps) {
  const sorted = [...blocks].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  if (sorted.length === 0) return <p className="py-3 text-sm text-muted">No blocks yet — add your first one below.</p>;
  return <div className="flex flex-col">{sorted.map((block) => <TimelineRow key={block.id} block={block} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} imports={imports} onApplySuggestion={onApplySuggestion} />)}</div>;
}

function TimelineRow({ block: b, onToggle, onDelete, onEdit, imports, onApplySuggestion }: { block: ScheduleBlock; onToggle: (id: string) => void; onDelete: (id: string) => void; onEdit: ScheduleTimelineProps["onEdit"]; imports: ImportedEntry[]; onApplySuggestion: ScheduleTimelineProps["onApplySuggestion"] }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(b.title);
  const [start, setStart] = useState(b.start);
  const [end, setEnd] = useState(b.end);
  const [type, setType] = useState<BlockType>(b.type);
  const suggestion = editing ? generateActionableSuggestion({ title, start, end, type }, [], imports, (next) => onEdit(b.id, next)) : null;
  function save() { onEdit(b.id, { title: title.trim() || b.title, start, end, type }); setEditing(false); }
  return (
    <div className="flex gap-3.5 border-b border-line py-3 last:border-none">
      <div className="w-16 shrink-0 pt-0.5 text-xs text-muted">{formatTime(b.start)}</div>
      <div className={`w-1 shrink-0 rounded-full ${TYPE_BAR[b.type]}`} />
      <div className="flex-1">
        {editing ? (
          <div className="grid grid-cols-2 gap-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-2 rounded-lg border border-line bg-surface-2 px-2 py-1 text-sm" />
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs" />
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs" />
            <select value={type} onChange={(e) => setType(e.target.value as BlockType)} className="col-span-2 rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs"><option value="study">Study</option><option value="break">Break</option><option value="exercise">Exercise</option><option value="sleep">Sleep / wind-down</option></select>
            {suggestion && <div className="col-span-2 rounded-lg bg-amber/10 px-2 py-1 text-xs">{suggestion.message} <button type="button" onClick={() => onApplySuggestion(suggestion)} className="font-semibold text-amber underline">{suggestion.applyLabel}</button></div>}
          </div>
        ) : (
          <>
            <div className={`text-sm font-medium ${b.done ? "text-muted line-through" : ""}`}>{b.title}</div>
            <div className="mt-0.5 text-xs text-muted">{formatTime(b.start)} – {formatTime(b.end)} · {formatDuration(durationMinutes(b.start, b.end))} · {TYPE_LABEL[b.type]}</div>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onToggle(b.id)} title="Toggle done" className="px-1 text-sm text-muted hover:text-ink">{b.done ? "↺" : "✓"}</button>
        {editing ? <button type="button" onClick={save} title="Save edit" className="px-1 text-sm text-teal">Save</button> : <button type="button" onClick={() => setEditing(true)} title="Edit" className="px-1 text-sm text-muted hover:text-ink">Edit</button>}
        <button type="button" onClick={() => onDelete(b.id)} title="Delete" className="px-1 text-sm text-muted hover:text-flag">✕</button>
      </div>
    </div>
  );
}
