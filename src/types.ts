export type BlockType = "study" | "break" | "exercise" | "sleep";

export interface ScheduleBlock {
  id: string;
  title: string;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  type: BlockType;
  done: boolean;
}

export type DraftBlock = Omit<ScheduleBlock, "id" | "done"> & { uncertain?: boolean };

export interface CheckIn {
  sleepHours?: number;
  exercised?: "yes" | "no";
}

export interface Reminder {
  id: string;
  title: string;
  at: string;
  notified?: boolean;
}

export interface ImportedEntry {
  id: string;
  createdAt: string;
  rawText: string;
  blocks: Array<Omit<ScheduleBlock, "id" | "done">>;
}

export interface DayRecord {
  blocks: ScheduleBlock[];
  checkin: CheckIn;
  reminders?: Reminder[];
  imports?: ImportedEntry[];
}
