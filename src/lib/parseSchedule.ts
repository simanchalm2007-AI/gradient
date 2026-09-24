import type { BlockType, DraftBlock } from "../types";

const TIME = /(\d{1,2})(?:[.:](\d{2}))?\s*(am|pm)?/i;

function parseTime(value: string, reference = 12 * 60): number | null {
  const match = value.match(TIME);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  const meridiem = match[3]?.toLowerCase();
  if (hour > 23 || minute > 59) return null;
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (!meridiem) {
    const candidates = [hour % 24, (hour % 24) + 12].filter((n) => n < 24);
    hour = candidates.reduce((best, candidate) =>
      Math.abs(candidate * 60 + minute - reference) < Math.abs(best * 60 + minute - reference) ? candidate : best,
    candidates[0]);
  }
  return hour * 60 + minute;
}

function clock(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function classify(title: string): BlockType {
  const value = title.toLowerCase();
  if (/(sleep|nap|wind.?down|bed)/.test(value)) return "sleep";
  if (/(gym|workout|walk|run|exercise|sport|yoga)/.test(value)) return "exercise";
  if (/(break|lunch|dinner|breakfast|bath|shower|commute|travel|rest)/.test(value)) return "break";
  return "study";
}

export function parseSchedule(input: string): DraftBlock[] {
  return parseScheduleDetailed(input).drafts;
}

export function parseScheduleDetailed(input: string): { drafts: DraftBlock[]; unparsedLines: string[] } {
  const drafts: DraftBlock[] = [];
  const unparsedLines: string[] = [];
  let previous = 8 * 60;
  for (const rawLine of input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)) {
    const colon = rawLine.match(/^(.*?)\s*:\s*(.+)$/);
    const firstTime = rawLine.search(TIME);
    const title = colon ? colon[1].trim() : firstTime > 0 ? rawLine.slice(0, firstTime).trim() : "";
    const timeText = colon ? colon[2] : firstTime > 0 ? rawLine.slice(firstTime) : "";
    if (!title || !timeText) {
      unparsedLines.push(rawLine);
      continue;
    }
    const matches = [...timeText.matchAll(new RegExp(TIME.source, "gi"))];
    if (!matches.length) {
      unparsedLines.push(rawLine);
      continue;
    }
    const start = parseTime(matches[0][0], previous);
    if (start === null) {
      unparsedLines.push(rawLine);
      continue;
    }
    const end = matches[1] ? parseTime(matches[1][0], start + 60) : start + 60;
    if (end === null) {
      unparsedLines.push(rawLine);
      continue;
    }
    const adjustedEnd = end <= start ? end + 1440 : end;
    drafts.push({
      title,
      start: clock(start),
      end: clock(adjustedEnd),
      type: classify(title),
      uncertain: !matches[0][0].match(/am|pm/i) || Boolean(matches[1] && !matches[1][0].match(/am|pm/i)),
    });
    previous = adjustedEnd % 1440;
  }
  return { drafts, unparsedLines };
}
