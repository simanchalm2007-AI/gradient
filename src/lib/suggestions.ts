import type { ScheduleBlock, CheckIn, ImportedEntry } from "../types";

export interface ActionableSuggestion {
  id: string;
  message: string;
  applyLabel: string;
  apply: () => void;
}

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function durationMinutes(start: string, end: string): number {
  const duration = toMinutes(end) - toMinutes(start);
  return duration > 0 ? duration : duration + 24 * 60;
}

export function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return (h ? `${h}h ` : "") + `${m}m`;
}

/** Pure, rule-based suggestions — no external calls, no AI dependency. */
export function generateSuggestions(blocks: ScheduleBlock[], checkin: CheckIn): string[] {
  const tips: string[] = [];
  const sorted = [...blocks].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

  sorted.forEach((b, i) => {
    if (b.type !== "study") return;
    const dur = durationMinutes(b.start, b.end);
    if (dur <= 90) return;
    const next = sorted[i + 1];
    const gapOk = next?.type === "break" && toMinutes(next.start) - toMinutes(b.end) <= 20;
    if (!gapOk) {
      tips.push(
        `"${b.title}" runs ${formatDuration(dur)} straight — add a short break after it. Focus holds up better in shorter stretches.`,
      );
    }

  });

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].type === "study" && sorted[i + 1].type === "study") {
      const gap = toMinutes(sorted[i + 1].start) - toMinutes(sorted[i].end);
      if (gap < 10) {
        tips.push(
          "Back-to-back study sessions with almost no gap — a 10–15 min breather between them will help retention.",
        );
        break;
      }
    }
  }

  const studyMin = sorted
    .filter((b) => b.type === "study")
    .reduce((s, b) => s + durationMinutes(b.start, b.end), 0);
  const hasExerciseBlock = sorted.some((b) => b.type === "exercise");
  if (studyMin > 300 && !hasExerciseBlock && checkin.exercised !== "yes") {
    tips.push(
      `Over ${formatDuration(studyMin)} of study today with no movement scheduled — even a 15-minute walk helps reset focus for the next session.`,
    );
  }

  if (checkin.sleepHours !== undefined && checkin.sleepHours < 6.5) {
    tips.push(
      `Only ${checkin.sleepHours}h of sleep logged — that's the biggest lever on tomorrow's focus. Try shifting your last study block 30 min earlier tonight.`,
    );
  }

  const hasSleepBlock = sorted.some((b) => b.type === "sleep");
  const lateStudy = sorted.some((b) => b.type === "study" && toMinutes(b.end) >= 22 * 60);
  if (lateStudy && !hasSleepBlock) {
    tips.push(
      "You're studying past 10 PM with no wind-down block — add 15–20 min of screen-free wind-down before bed to fall asleep faster.",
    );
  }

  const totalMin = sorted.reduce((s, b) => s + durationMinutes(b.start, b.end), 0);
  if (totalMin > 14 * 60) {
    tips.push(
      "Today's schedule totals over 14 hours — consider cutting one block. A lighter, realistic plan is easier to actually finish.",
    );
  }

  if (sorted.length === 0) {
    tips.push("Add a few blocks for today to get personalized suggestions on pacing, breaks, and recovery.");
  }

  return tips.slice(0, 5);
}

/** Finds encouraging, deterministic patterns once a few imports are available. */
export function generateRoutineSuggestions(
  imports: ImportedEntry[],
  todayBlocks: ScheduleBlock[],
  currentStreak: number,
): string[] {
  if (imports.length < 3) {
    return ["Keep logging your days — personalized routine suggestions unlock after 3 imports."];
  }

  const tips: string[] = [];
  const normalized = (title: string) => title.trim().toLowerCase();
  const recentImports = imports.filter((entry) => Date.now() - new Date(entry.createdAt).getTime() <= 60 * 24 * 60 * 60 * 1000);
  const sourceImports = recentImports.length >= 3 ? recentImports : imports;
  const frequency = new Map<string, { title: string; count: number }>();
  for (const entry of sourceImports) {
    const seen = new Set<string>();
    for (const block of entry.blocks) {
      const key = normalized(block.title);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const item = frequency.get(key) ?? { title: block.title, count: 0 };
      item.count += 1;
      frequency.set(key, item);
    }
  }

  const recurring = [...frequency.values()].sort((a, b) => b.count - a.count);
  const todayTitles = new Set(todayBlocks.map((block) => normalized(block.title)));
  const expected = recurring.find(
    (item) => item.count >= Math.max(3, Math.ceil(sourceImports.length * 0.6)) && !todayTitles.has(normalized(item.title)),
  );
  if (expected) {
    tips.push(`You often include "${expected.title}" — consider adding it today if it supports your plan.`);
  }

  const weekday = new Date().getDay();
  const weekdayImports = sourceImports.filter((entry) => new Date(entry.createdAt).getDay() === weekday);
  if (weekdayImports.length >= 2 && weekdayImports.length < sourceImports.length / 2) {
    tips.push("You tend to log fewer activities on this weekday — a lighter, realistic plan may be easier to finish.");
  }

  if (currentStreak > 0 && currentStreak % 5 === 4) {
    tips.push(`You're one completed day away from a ${currentStreak + 1}-day streak — keep the next step small and achievable.`);
  }

  if (tips.length === 0) {
    tips.push("Your routine is taking shape. Keep logging a few more days to reveal stronger patterns.");
  }
  return tips.slice(0, 3);
}

export function generateActionableSuggestion(
  draft: Omit<ScheduleBlock, "id" | "done">,
  existing: ScheduleBlock[],
  imports: ImportedEntry[],
  onApply: (next: Omit<ScheduleBlock, "id" | "done">) => void,
): ActionableSuggestion | null {
  if (!draft.title.trim() || !draft.start || !draft.end) return null;
  const start = toMinutes(draft.start);
  const end = toMinutes(draft.end);
  const overlap = existing.find((block) => {
    const otherStart = toMinutes(block.start);
    const otherEnd = otherStart + durationMinutes(block.start, block.end);
    return start < otherEnd && end > otherStart;
  });
  if (overlap) {
    const shiftedStart = String(Math.min(23, Math.floor((toMinutes(overlap.end) + 15) / 60))).padStart(2, "0") + ":" + String((toMinutes(overlap.end) + 15) % 60).padStart(2, "0");
    const shiftedEnd = String(Math.min(23, Math.floor((toMinutes(overlap.end) + 15 + durationMinutes(draft.start, draft.end)) / 60))).padStart(2, "0") + ":" + String((toMinutes(overlap.end) + 15 + durationMinutes(draft.start, draft.end)) % 60).padStart(2, "0");
    return {
      id: `overlap-${overlap.id}`,
      message: `This overlaps with "${overlap.title}". Shift it to ${shiftedStart}?`,
      applyLabel: "Apply shift",
      apply: () => onApply({ ...draft, start: shiftedStart, end: shiftedEnd }),
    };
  }
  if (imports.length < 3) return null;
  const similar = imports
    .flatMap((entry) => entry.blocks)
    .filter((block) => block.title.trim().toLowerCase() === draft.title.trim().toLowerCase());
  if (similar.length < 3) return null;
  const usualStart = Math.round(similar.reduce((sum, block) => sum + toMinutes(block.start), 0) / similar.length);
  if (Math.abs(usualStart - start) < 90) return null;
  const suggestedStart = String(Math.floor(usualStart / 60)).padStart(2, "0") + ":" + String(usualStart % 60).padStart(2, "0");
  return {
    id: `routine-${draft.title.toLowerCase()}`,
    message: `You usually do "${draft.title}" around ${formatClock(suggestedStart)}. Move it there?`,
    applyLabel: "Use usual time",
    apply: () => onApply({ ...draft, start: suggestedStart }),
  };
}

function formatClock(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}
