import { useState } from "react";
import type { BlockType, ImportedEntry } from "../types";

export function ImportHistory({ entries, onDelete, onEdit }: { entries: ImportedEntry[]; onDelete: (id: string) => void; onEdit: (id: string, blocks: ImportedEntry["blocks"]) => void }) {
  return (
    <section id="import-history" className="mt-5 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-display text-lg font-semibold">Import history</h2>
      <p className="mt-1 text-xs text-muted">Review, correct, or delete any previous import.</p>
      {entries.length === 0 ? <p className="mt-4 text-sm text-muted">No imports saved yet.</p> : (
        <div className="mt-4 space-y-2">{entries.map((entry) => <ImportEntry key={entry.id} entry={entry} onDelete={onDelete} onEdit={onEdit} />)}</div>
      )}
    </section>
  );
}

function ImportEntry({ entry, onDelete, onEdit }: { entry: ImportedEntry; onDelete: (id: string) => void; onEdit: (id: string, blocks: ImportedEntry["blocks"]) => void }) {
  const [editing, setEditing] = useState(false);
  const [blocks, setBlocks] = useState(entry.blocks);
  function update(index: number, patch: Partial<ImportedEntry["blocks"][number]>) {
    setBlocks((current) => current.map((block, i) => i === index ? { ...block, ...patch } : block));
  }
  return (
    <details className="rounded-xl border border-line bg-surface-2 p-3">
      <summary className="cursor-pointer text-sm font-medium">{new Date(entry.createdAt).toLocaleString()} · {entry.blocks.length} activities</summary>
      <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap text-xs text-muted">{entry.rawText}</pre>
      {editing ? <div className="mt-3 space-y-2">{blocks.map((block, index) => <div key={`${entry.id}-${index}`} className="grid grid-cols-2 gap-2"><input value={block.title} onChange={(e) => update(index, { title: e.target.value })} className="col-span-2 rounded-lg border border-line bg-surface px-2 py-1 text-xs" /><input type="time" value={block.start} onChange={(e) => update(index, { start: e.target.value })} className="rounded-lg border border-line bg-surface px-2 py-1 text-xs" /><input type="time" value={block.end} onChange={(e) => update(index, { end: e.target.value })} className="rounded-lg border border-line bg-surface px-2 py-1 text-xs" /><select value={block.type} onChange={(e) => update(index, { type: e.target.value as BlockType })} className="col-span-2 rounded-lg border border-line bg-surface px-2 py-1 text-xs"><option value="study">Study</option><option value="break">Break</option><option value="exercise">Exercise</option><option value="sleep">Sleep / wind-down</option></select></div>)}</div> : <div className="mt-3 space-y-1 text-xs text-muted">{entry.blocks.map((block, index) => <div key={`${entry.id}-summary-${index}`}>{block.start}–{block.end} · {block.title}</div>)}</div>}
      <div className="mt-3 flex gap-3 text-xs"><button type="button" onClick={() => { if (editing) onEdit(entry.id, blocks); setEditing((value) => !value); }} className="font-semibold text-amber hover:underline">{editing ? "Save edits" : "Edit entry"}</button><button type="button" onClick={() => onDelete(entry.id)} className="text-flag hover:underline">Delete import</button></div>
    </details>
  );
}
