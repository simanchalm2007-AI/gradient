import { useState, type FormEvent } from "react";
import type { BlockType } from "../types";

interface AddBlockFormProps {
  onAdd: (block: { title: string; start: string; end: string; type: BlockType }) => void;
}

export function AddBlockForm({ onAdd }: AddBlockFormProps) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [type, setType] = useState<BlockType>("study");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !start || !end) return;
    onAdd({ title: title.trim(), start, end, type });
    setTitle("");
    setStart("");
    setEnd("");
    setType("study");
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-sm text-ink outline-none focus:outline-2 focus:outline-amber";

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-4 gap-2.5 max-[560px]:grid-cols-2">
      <div className="col-span-4 max-[560px]:col-span-2">
        <label className="mb-1 block text-xs text-muted">Completed activity</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Physics revision"
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Start</label>
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">End</label>
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Type</label>
        <select value={type} onChange={(e) => setType(e.target.value as BlockType)} className={inputClass}>
          <option value="study">Study</option>
          <option value="break">Break</option>
          <option value="exercise">Exercise</option>
          <option value="sleep">Sleep / wind-down</option>
        </select>
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          className="w-full rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-bg hover:brightness-110"
        >
          Log activity
        </button>
      </div>
    </form>
  );
}
