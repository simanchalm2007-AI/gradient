export type BlockType = "study" | "break" | "exercise" | "sleep";

export interface ScheduleBlock {
  id: string;
  title: string;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  type: BlockType;
  done: boolean;
}

export type DraftBlock = Omit<ScheduleBlock, "id" | "done">;

export interface CheckIn {
  sleepHours?: number;
  exercised?: "yes" | "no";
}

export interface DayRecord {
  blocks: ScheduleBlock[];
  checkin: CheckIn;
}
