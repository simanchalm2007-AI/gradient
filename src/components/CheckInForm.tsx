import { useState } from "react";
import type { CheckIn } from "../types";

interface CheckInFormProps {
  value: CheckIn;
  onSave: (checkin: CheckIn) => void;
}

export function CheckInForm({ value, onSave }: CheckInFormProps) {
  const [sleep, setSleep] = useState(value.sleepHours?.toString() ?? "");
  const [exercised, setExercised] = useState<"" | "yes" | "no">(value.exercised ?? "");
  const [steps, setSteps] = useState(value.stepCount?.toString() ?? "");
  const [healthSource, setHealthSource] = useState<CheckIn["healthSource"]>(value.healthSource);
  const [healthMessage, setHealthMessage] = useState("");

  const inputClass = "w-full rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-sm text-ink outline-none focus:outline-2 focus:outline-amber";
  function connectHealth(source: NonNullable<CheckIn["healthSource"]>) {
    setHealthSource(source);
    setHealthMessage("Connected for this preview. A native iOS/Android wrapper is required to read real health data.");
  }
  function save() {
    onSave({
      sleepHours: sleep === "" ? undefined : Number(sleep),
      exercised: exercised || undefined,
      stepCount: steps === "" ? undefined : Number(steps),
      healthSource,
    });
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted">Hours slept last night</label>
          <input type="number" min={0} max={14} step={0.5} value={sleep} onChange={(e) => setSleep(e.target.value)} placeholder="7.5" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Sports or Exercise</label>
          <select value={exercised} onChange={(e) => setExercised(e.target.value as typeof exercised)} className={inputClass}>
            <option value="">—</option><option value="yes">Yes</option><option value="no">No</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Steps today</label>
          <input type="number" min={0} value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="Manual entry" className={inputClass} />
        </div>
        <div>
          <span className="mb-1 block text-xs text-muted">Connect health app</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => connectHealth("apple-health")} className={`rounded-lg border px-2 py-2 text-xs ${healthSource === "apple-health" ? "border-amber text-amber" : "border-line text-muted"}`}>Apple Health</button>
            <button type="button" onClick={() => connectHealth("health-connect")} className={`rounded-lg border px-2 py-2 text-xs ${healthSource === "health-connect" ? "border-amber text-amber" : "border-line text-muted"}`}>Health Connect</button>
          </div>
        </div>
      </div>
      {healthMessage && <p className="mt-2 text-xs text-muted">{healthMessage}</p>}
      <button type="button" onClick={save} className="mt-3 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-muted">Save check-in</button>
    </div>
  );
}
