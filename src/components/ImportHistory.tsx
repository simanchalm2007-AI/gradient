import type { ImportedEntry } from "../types";

export function ImportHistory({ entries, onDelete }: { entries: ImportedEntry[]; onDelete: (id: string) => void }) {
  return (
    <section id="import-history" className="mt-5 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-display text-lg font-semibold">Import history</h2>
      <p className="mt-1 text-xs text-muted">Previously saved imports remain available after refresh and sign-in.</p>
      {entries.length === 0 ? <p className="mt-4 text-sm text-muted">No imports saved yet.</p> : (
        <div className="mt-4 space-y-2">
          {entries.map((entry) => (
            <details key={entry.id} className="rounded-xl border border-line bg-surface-2 p-3">
              <summary className="cursor-pointer text-sm font-medium">{new Date(entry.createdAt).toLocaleString()} · {entry.blocks.length} activities</summary>
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-muted">{entry.rawText}</pre>
              <button type="button" onClick={() => onDelete(entry.id)} className="mt-3 text-xs text-flag hover:underline">Delete import</button>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
