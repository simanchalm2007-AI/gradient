import { useState } from "react";

interface AssistantProps {
  onNavigate: (target: string) => void;
}

export function Assistant({ onNavigate }: AssistantProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("Try “open my saved details”, “show my streak”, or “go to dashboard”.");
  function submit() {
    const command = input.trim().toLowerCase();
    if (!command) return;
    if (command.includes("saved") || command.includes("history") || command.includes("import")) {
      setReply("Here are your saved details.");
      onNavigate("import-history");
    } else if (command.includes("streak") || command.includes("progress")) {
      setReply("Opening your progress and streak.");
      onNavigate("progress");
    } else if (command.includes("schedule") || command.includes("dashboard")) {
      setReply("Opening today's schedule.");
      onNavigate("schedule");
    } else {
      setReply("I can open your schedule, progress, or saved details.");
    }
    setInput("");
  }
  return (
    <div className="fixed bottom-5 left-5 z-20">
      {open && <div className="mb-2 w-[min(330px,calc(100vw-40px))] rounded-2xl border border-line bg-surface p-4 shadow-xl"><h2 className="font-semibold">Gradient assistant</h2><p className="mt-2 text-xs text-muted">{reply}</p><div className="mt-3 flex gap-2"><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="Ask me to open something" className="min-w-0 flex-1 rounded-lg border border-line bg-surface-2 px-2 py-2 text-xs" /><button type="button" onClick={submit} className="rounded-lg bg-amber px-3 py-2 text-xs font-semibold text-bg">Go</button></div></div>}
      <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-full bg-amber px-4 py-2 text-xs font-semibold text-bg shadow-lg">{open ? "Close assistant" : "Assistant"}</button>
    </div>
  );
}
