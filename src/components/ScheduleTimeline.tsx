import type { ScheduleBlock, BlockType } from "../types";
import { durationMinutes, formatDuration } from "../lib/suggestions";

interface ScheduleTimelineProps {
  blocks: ScheduleBlock[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const TYPE_LABEL: Record<BlockType, string> = {
  study: "Study",
  break: "Break",
  exercise: "Exercise",
  sleep: "Sleep / wind-down",
};

const TYPE_BAR: Record<BlockType, string> = {
  study: "bg-amber",
  break: "bg-violet",
  exercise: "bg-teal",
  sleep: "bg-[#5b6199]",
};

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function ScheduleTimeline({ blocks, onToggle, onDelete }: ScheduleTimelineProps) {
  const sorted = [...blocks].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

  if (sorted.length === 0) {
    return <p className="py-3 text-sm text-muted">No blocks yet — add your first one below.</p>;
  }

  return (
    <div className="flex flex-col">
      {sorted.map((b) => (
        <div key={b.id} className="flex gap-3.5 border-b border-line py-3 last:border-none">
          <div className="w-16 shrink-0 pt-0.5 text-xs text-muted">{formatTime(b.start)}</div>
          <div className={`w-1 shrink-0 rounded-full ${TYPE_BAR[b.type]}`} />
          <div className="flex-1">
            <div className={`text-sm font-medium ${b.done ? "text-muted line-through" : ""}`}>{b.title}</div>
            <div className="mt-0.5 text-xs text-muted">
              {formatTime(b.start)} – {formatTime(b.end)} · {formatDuration(durationMinutes(b.start, b.end))} ·{" "}
              {TYPE_LABEL[b.type]}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggle(b.id)}
              title="Toggle done"
              className="px-1 text-sm text-muted hover:text-ink"
            >
              {b.done ? "↺" : "✓"}
            </button>
            <button
              type="button"
              onClick={() => onDelete(b.id)}
              title="Delete"
              className="px-1 text-sm text-muted hover:text-ink"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
