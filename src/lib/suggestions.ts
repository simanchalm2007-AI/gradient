import type { ScheduleBlock, CheckIn } from "../types";

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
