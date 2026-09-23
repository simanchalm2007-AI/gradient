import { useState } from "react";
import type { CheckIn } from "../types";

interface CheckInFormProps {
  value: CheckIn;
  onSave: (checkin: CheckIn) => void;
}

export function CheckInForm({ value, onSave }: CheckInFormProps) {
  const [sleep, setSleep] = useState<string>(value.sleepHours?.toString() ?? "");
  const [exercised, setExercised] = useState<"" | "yes" | "no">(value.exercised ?? "");

  const inputClass =
    "w-full rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-sm text-ink outline-none focus:outline-2 focus:outline-amber";

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted">Hours slept last night</label>
          <input
            type="number"
            min={0}
            max={14}
            step={0.5}
            value={sleep}
            onChange={(e) => setSleep(e.target.value)}
            placeholder="7.5"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Moved / exercised today?</label>
          <select value={exercised} onChange={(e) => setExercised(e.target.value as typeof exercised)} className={inputClass}>
            <option value="">—</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>
      <button
        type="button"
        onClick={() =>
          onSave({
            sleepHours: sleep === "" ? undefined : Number(sleep),
            exercised: exercised || undefined,
          })
        }
        className="mt-3 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-muted"
      >
        Save check-in
      </button>
    </div>
  );
}
