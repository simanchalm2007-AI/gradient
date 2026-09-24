import { useState, type FormEvent } from "react";
import type { Reminder } from "../types";

export function ReminderForm({ reminders, onAdd, onDelete }: {
  reminders: Reminder[];
  onAdd: (reminder: Omit<Reminder, "id">) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [at, setAt] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !at) return;
    if (!("Notification" in window)) {
      setNotice("Notifications are not supported by this browser.");
      return;
    }
    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNotice("Allow notifications in your browser to receive reminders.");
        return;
      }
    }
    onAdd({ title: title.trim(), at });
    setTitle("");
    setAt("");
    setNotice("Reminder saved. Keep Gradient open for the scheduled alert.");
  }

  return (
    <div className="mt-5 rounded-xl border border-line bg-surface-2 p-4">
      <h3 className="font-display text-base font-semibold">Plan work & reminders</h3>
      <p className="mt-1 text-xs text-muted">Set a task for later. Browser notifications work while this app is open.</p>
      <form onSubmit={submit} className="mt-3 grid grid-cols-[1fr_120px_auto] gap-2 max-[560px]:grid-cols-1">
        <input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Submit assignment" className="rounded-lg border border-line bg-surface px-2.5 py-2 text-sm outline-none focus:outline-2 focus:outline-amber" />
        <input required type="time" value={at} onChange={(event) => setAt(event.target.value)} className="rounded-lg border border-line bg-surface px-2.5 py-2 text-sm outline-none focus:outline-2 focus:outline-amber" />
        <button className="rounded-lg bg-violet px-3 py-2 text-sm font-semibold text-white">Set reminder</button>
      </form>
      {notice && <p className="mt-2 text-xs text-muted">{notice}</p>}
      {reminders.length > 0 && <ul className="mt-3 space-y-2">{reminders.map((reminder) => <li key={reminder.id} className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-sm"><span>{reminder.at} · {reminder.title}</span><button type="button" onClick={() => onDelete(reminder.id)} className="text-xs text-muted hover:text-flag">Remove</button></li>)}</ul>}
    </div>
  );
}
