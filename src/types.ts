export type BlockType = "study" | "break" | "exercise" | "sleep";
export type TaskCategory = "college" | "personal";

export interface ScheduleBlock {
  id: string;
  title: string;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  type: BlockType;
  done: boolean;
  category?: TaskCategory;
}

export type DraftBlock = Omit<ScheduleBlock, "id" | "done"> & { uncertain?: boolean };

export interface CheckIn {
  sleepHours?: number;
  exercised?: "yes" | "no";
  stepCount?: number;
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

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type AttendanceStatus = "present" | "absent" | "cancelled";

export interface TimetableEntry {
  id: string;
  subject: string;
  days: Weekday[];
  start: string;
  end: string;
  room?: string;
  faculty?: string;
  semester?: string;
  archived?: boolean;
}

export interface AttendanceRecord {
  instanceId: string;
  timetableId: string;
  date: string;
  status: AttendanceStatus;
}

export interface DayRecord {
  blocks: ScheduleBlock[];
  checkin: CheckIn;
  reminders?: Reminder[];
  imports?: ImportedEntry[];
  attendance?: AttendanceRecord[];
}
