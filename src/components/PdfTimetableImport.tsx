import { useState, type ChangeEvent } from "react";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createWorker } from "tesseract.js";
import type { TimetableEntry, Weekday } from "../types";

const dayMap: Record<string, Weekday> = { sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tues: 2, tuesday: 2, wed: 3, wednesday: 3, thu: 4, thurs: 4, thursday: 4, fri: 5, friday: 5, sat: 6, saturday: 6 };
const dayPattern = "(sun(?:day)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?)";
const timePattern = "(\\d{1,2})[.:](\\d{2})\\s*(am|pm)?\\s*[-–]\\s*(\\d{1,2})[.:](\\d{2})\\s*(am|pm)?";

interface Props {
  onAdd: (entry: Omit<TimetableEntry, "id">) => void;
}

function toTime(hour: string, minute: string, meridiem?: string): string {
  let value = Number(hour);
  if (meridiem?.toLowerCase() === "pm" && value < 12) value += 12;
  if (meridiem?.toLowerCase() === "am" && value === 12) value = 0;
  return `${String(value).padStart(2, "0")}:${minute}`;
}

function parseRows(text: string): Array<Omit<TimetableEntry, "id">> {
  const rows: Array<Omit<TimetableEntry, "id">> = [];
  for (const rawLine of text.split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean)) {
    const dayMatch = rawLine.match(new RegExp(dayPattern, "i"));
    const timeMatch = rawLine.match(new RegExp(timePattern, "i"));
    if (!dayMatch || !timeMatch) continue;
    const subject = rawLine
      .replace(dayMatch[0], "")
      .replace(timeMatch[0], "")
      .replace(/^[|,:;-]+|[|,:;-]+$/g, "")
      .trim();
    if (!subject || subject.length < 2) continue;
    rows.push({
      subject,
      days: [dayMap[dayMatch[0].toLowerCase()]],
      start: toTime(timeMatch[1], timeMatch[2], timeMatch[3]),
      end: toTime(timeMatch[4], timeMatch[5], timeMatch[6]),
      archived: false,
    });
  }
  return rows.filter((row, index, all) => all.findIndex((candidate) => candidate.subject === row.subject && candidate.start === row.start && candidate.end === row.end && candidate.days[0] === row.days[0]) === index);
}

async function extractPdfText(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
  }

  return pages.join("\n");
}

async function extractOcrText(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data }).promise;
  const worker = await createWorker("eng");
  const pages: string[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable for OCR.");
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const result = await worker.recognize(canvas);
      pages.push(result.data.text);
    }
  } finally {
    await worker.terminate();
  }
  return pages.join("\n");
}

export function PdfTimetableImport({ onAdd }: Props) {
  const [rows, setRows] = useState<Array<Omit<TimetableEntry, "id">>>([]);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setBusy(true);
    setStatus("");
    try {
      const text = await extractPdfText(file);
      let extracted = parseRows(text);
      if (!extracted.length) {
        setStatus("No text rows found. Running local OCR on the PDF pages…");
        extracted = parseRows(await extractOcrText(file));
      }
      setRows(extracted);
      setStatus(extracted.length ? `Found ${extracted.length} class rows. Review and correct them before importing.` : "No timetable rows were recognized. Add entries manually or check the scan quality.");
    } catch (error) {
      console.error("Gradient timetable PDF extraction failed", error);
      setStatus("Could not read this PDF. Scanned/image-only PDFs need OCR or a native AI service.");
    } finally {
      setBusy(false);
    }
  }
  function update(index: number, patch: Partial<Omit<TimetableEntry, "id">>) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  }
  return (
    <div className="mt-4 rounded-xl border border-line bg-surface-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h3 className="text-sm font-semibold">Import timetable PDF</h3><p className="mt-1 text-xs text-muted">Smart extraction runs locally in your browser; review before saving.</p></div>
        <label className="cursor-pointer rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold hover:border-amber"><input type="file" accept="application/pdf,.pdf" onChange={handleFile} className="sr-only" />{busy ? "Reading PDF…" : "Choose PDF"}</label>
      </div>
      {fileName && <p className="mt-2 text-xs text-muted">{fileName}</p>}
      {status && <p className="mt-2 rounded-lg border border-amber/30 bg-amber/10 px-2.5 py-2 text-xs">{status}</p>}
      {rows.length > 0 && <div className="mt-3 space-y-2">
        {rows.map((row, index) => <div key={`${row.subject}-${index}`} className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-surface p-2 sm:grid-cols-5">
          <input value={row.subject} onChange={(e) => update(index, { subject: e.target.value })} className="col-span-2 rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-xs sm:col-span-2" />
          <input type="time" value={row.start} onChange={(e) => update(index, { start: e.target.value })} className="rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-xs" />
          <input type="time" value={row.end} onChange={(e) => update(index, { end: e.target.value })} className="rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-xs" />
          <input value={row.faculty ?? ""} onChange={(e) => update(index, { faculty: e.target.value || undefined })} placeholder="Faculty" className="rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-xs" />
        </div>)}
        <button type="button" onClick={() => { rows.forEach(onAdd); setRows([]); setStatus("Timetable imported and saved."); }} className="rounded-lg bg-amber px-3 py-2 text-xs font-semibold text-bg">Import reviewed classes</button>
      </div>}
    </div>
  );
}
