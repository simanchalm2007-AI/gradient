import { useState, type FormEvent } from "react";
import type { TimetableEntry, Weekday } from "../types";
import { PdfTimetableImport } from "./PdfTimetableImport";

const days: Array<{ value: Weekday; label: string; short: string }> = [
  { value: 1, label: "Monday", short: "Mon" }, { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" }, { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" }, { value: 6, label: "Saturday", short: "Sat" }, { value: 0, label: "Sunday", short: "Sun" },
];

interface Props {
  entries: TimetableEntry[];
  onAdd: (entry: Omit<TimetableEntry, "id">) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}

export function Timetable({ entries, onAdd, onDelete, onArchive }: Props) {
  const [subject, setSubject] = useState(""); const [start, setStart] = useState("09:00"); const [end, setEnd] = useState("10:00");
  const [room, setRoom] = useState(""); const [semester, setSemester] = useState(""); const [selectedDays, setSelectedDays] = useState<Weekday[]>([1]);
  const semesters = [...new Set(entries.map((entry) => entry.semester).filter((value): value is string => Boolean(value)))];
  const [selectedSemester, setSelectedSemester] = useState("all");
  const visibleEntries = entries.filter((entry) => !entry.archived && (selectedSemester === "all" || entry.semester === selectedSemester));
  const input = "w-full rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-sm text-ink outline-none focus:outline-2 focus:outline-amber";
  const toggleDay = (day: Weekday) => setSelectedDays((current) => current.includes(day) ? current.filter((value) => value !== day) : [...current, day]);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!subject.trim() || !start || !end || selectedDays.length === 0) return;
    onAdd({ subject: subject.trim(), start, end, days: selectedDays, room: room.trim() || undefined, semester: semester.trim() || undefined, archived: false });
    setSubject(""); setRoom("");
  }
  return <section className="mt-5 rounded-2xl border border-line bg-surface p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-lg font-semibold">Weekly timetable</h2><p className="mt-1 text-xs text-muted">Recurring classes stay separate from your completed activities.</p></div><div className="flex items-center gap-2"><select aria-label="Timetable semester" value={selectedSemester} onChange={(event) => setSelectedSemester(event.target.value)} className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs"><option value="all">All semesters</option>{semesters.map((value) => <option key={value} value={value}>{value}</option>)}</select><span className="rounded-full bg-amber/10 px-2.5 py-1 text-xs text-amber">{visibleEntries.length} active</span></div></div>
    <div className="mt-4 grid gap-2 overflow-x-auto sm:grid-cols-7">
      {days.map((day) => <div key={day.value} className="min-w-[110px] rounded-xl border border-line bg-surface-2 p-2"><div className="mb-2 text-xs font-semibold text-muted">{day.short}</div>{visibleEntries.filter((entry) => entry.days.includes(day.value)).sort((a, b) => a.start.localeCompare(b.start)).map((entry) => <div key={entry.id} className="group mb-2 rounded-lg border border-line bg-surface p-2 text-xs"><div className="font-semibold">{entry.subject}</div><div className="text-muted">{entry.start}–{entry.end}</div>{entry.room && <div className="text-muted">{entry.room}</div>}<div className="mt-1 flex gap-2 text-[11px] opacity-0 group-hover:opacity-100"><button type="button" onClick={() => onArchive(entry.id)} className="text-muted">Archive</button><button type="button" onClick={() => onDelete(entry.id)} className="text-flag">Delete</button></div></div>)}</div>)}
    </div>
    <form onSubmit={submit} className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      <input className="col-span-2 w-full rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-sm text-ink outline-none focus:outline-2 focus:outline-amber sm:col-span-2" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" required />
      <input className={input} type="time" value={start} onChange={(e) => setStart(e.target.value)} required /><input className={input} type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
      <input className={input} value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room (optional)" /><input className={input} value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="Semester (optional)" />
      <div className="col-span-2 flex flex-wrap gap-1 sm:col-span-2">{days.map((day) => <button type="button" key={day.value} onClick={() => toggleDay(day.value)} className={`rounded-full border px-2.5 py-1 text-xs ${selectedDays.includes(day.value) ? "border-amber bg-amber text-bg" : "border-line text-muted"}`}>{day.short}</button>)}</div>
      <button className="col-span-2 rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-bg hover:brightness-110 sm:col-span-4" type="submit">Add timetable entry</button>
    </form>
    <PdfTimetableImport onAdd={onAdd} />
  </section>;
}
