import { useState } from "react";
import type { BlockType, DraftBlock } from "../types";
import { parseScheduleDetailed } from "../lib/parseSchedule";

interface ScheduleImportProps {
  onConfirm: (blocks: DraftBlock[], rawText: string) => void;
}

const inputClass =
  "w-full rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-sm text-ink outline-none focus:outline-2 focus:outline-amber";

export function ScheduleImport({ onConfirm }: ScheduleImportProps) {
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<DraftBlock[]>([]);
  const [unparsedLines, setUnparsedLines] = useState<string[]>([]);
  const [listening, setListening] = useState(false);

  function parse() {
    const result = parseScheduleDetailed(text);
    setDrafts(result.drafts);
    setUnparsedLines(result.unparsedLines);
  }

  function toggleVoice() {
    const speechWindow = window as Window & {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    };
    const SpeechRecognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      window.alert("Voice input is not supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText((current) => `${current}${current ? "\n" : ""}${transcript}`);
    };
    recognition.start();
  }

  function update(index: number, patch: Partial<DraftBlock>) {
    setDrafts((current) => current.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)));
  }

  function insertBreak(index: number) {
    const draft = drafts[index];
    const start = draft.start.split(":").map(Number);
    const end = draft.end.split(":").map(Number);
    const startMin = start[0] * 60 + start[1];
    const endMin = end[0] * 60 + end[1] + (end[0] * 60 + end[1] <= startMin ? 1440 : 0);
    if (endMin - startMin <= 120) return;
    const split = startMin + Math.floor((endMin - startMin) / 2);
    const mid = `${String(Math.floor(split / 60) % 24).padStart(2, "0")}:${String(split % 60).padStart(2, "0")}`;
    setDrafts((current) => [
      ...current.slice(0, index),
      { ...draft, end: mid },
      { title: "Short break", start: mid, end: `${String(Math.floor((split + 15) / 60) % 24).padStart(2, "0")}:${String((split + 15) % 60).padStart(2, "0")}`, type: "break" },
      { ...draft, start: `${String(Math.floor((split + 15) / 60) % 24).padStart(2, "0")}:${String((split + 15) % 60).padStart(2, "0")}` },
      ...current.slice(index + 1),
    ]);
  }

  return (
    <div className="mb-5 rounded-xl border border-line bg-surface-2 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Import your day</h2>
          <p className="mt-1 text-xs text-muted">One activity per line, for example: college: 9:30 am to 5 pm</p>
        </div>
        <button type="button" onClick={toggleVoice} className={`rounded-lg border border-line px-3 py-2 text-sm ${listening ? "text-flag" : "text-ink"}`}>
          {listening ? "Listening…" : "🎙 Speak"}
        </button>
      </div>
      <textarea value={text} onChange={(event) => setText(event.target.value)} rows={4} className={`${inputClass} mt-3 resize-y`} placeholder={"wake up: 8 am\nphysics: 9-11 am\ngym: 5:30-6:30 pm"} />
      <button type="button" onClick={parse} disabled={!text.trim()} className="mt-2 rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-bg disabled:opacity-40">Parse schedule</button>
      {drafts.length > 0 && (
        <div className="mt-4 space-y-2">
          {drafts.some((draft) => draft.uncertain) && (
            <p className="rounded-lg border border-amber/40 bg-amber/10 px-3 py-2 text-xs text-amber">
              Yellow-marked times are approximate because no AM/PM was provided. Review them before saving.
            </p>
          )}
          {unparsedLines.length > 0 && (
            <div className="rounded-lg border border-flag/40 bg-flag/10 px-3 py-2 text-xs text-flag">
              <strong>Could not parse:</strong> {unparsedLines.join(" · ")}
            </div>
          )}
          {drafts.map((draft, index) => (
            <div key={`${draft.title}-${index}`} className={`grid grid-cols-[1fr_90px_90px_120px_auto] items-end gap-2 rounded-lg p-1 max-[650px]:grid-cols-2 ${draft.uncertain ? "bg-amber/10" : ""}`}>
              <label className="text-xs text-muted">Activity<input value={draft.title} onChange={(e) => update(index, { title: e.target.value })} className={inputClass} /></label>
              <label className="text-xs text-muted">Start<input type="time" value={draft.start} onChange={(e) => update(index, { start: e.target.value })} className={inputClass} /></label>
              <label className="text-xs text-muted">End<input type="time" value={draft.end} onChange={(e) => update(index, { end: e.target.value })} className={inputClass} /></label>
              <label className="text-xs text-muted">Type<select value={draft.type} onChange={(e) => update(index, { type: e.target.value as BlockType })} className={inputClass}><option value="study">Study</option><option value="break">Break</option><option value="exercise">Exercise</option><option value="sleep">Sleep / wind-down</option></select></label>
              <button type="button" onClick={() => insertBreak(index)} className="rounded-lg border border-line px-2 py-2 text-xs text-muted hover:text-ink">+ break</button>
              <button type="button" onClick={() => setDrafts((current) => current.filter((_, i) => i !== index))} className="rounded-lg border border-line px-2 py-2 text-xs text-muted hover:text-flag">Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => { onConfirm(drafts.map(({ uncertain: _uncertain, ...draft }) => draft), text); setDrafts([]); setUnparsedLines([]); setText(""); }} className="mt-2 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-bg">Save reviewed import</button>
        </div>
      )}
    </div>
  );
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  onstart: () => void;
  onend: () => void;
  onerror: () => void;
  onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  start: () => void;
}
