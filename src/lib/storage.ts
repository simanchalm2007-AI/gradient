import { useCallback, useEffect, useRef, useState } from "react";
import type { DayRecord, ScheduleBlock, CheckIn, Reminder, ImportedEntry } from "../types";
import { supabase } from "./supabase";

const DB_KEY = "gradient_db";
const BACKUP_KEY = "gradient_internal_backups";
const MAX_BACKUPS = 20;

type DB = Record<string, DayRecord>;
interface InternalBackup {
  id: string;
  createdAt: string;
  reason: string;
  db: DB;
}

function localDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function loadDB(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? (JSON.parse(raw) as DB) : {};
  } catch {
    return {};
  }
}

function saveDB(db: DB): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function saveInternalBackup(db: DB, reason: string): void {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    const backups = raw ? JSON.parse(raw) as InternalBackup[] : [];
    const next: InternalBackup[] = [
      { id: crypto.randomUUID(), createdAt: new Date().toISOString(), reason, db },
      ...backups,
    ].slice(0, MAX_BACKUPS);
    localStorage.setItem(BACKUP_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("Gradient internal backup skipped", error);
  }
}

function emptyDay(): DayRecord {
  return { blocks: [], checkin: {}, reminders: [], imports: [] };
}

/** Reads/writes today's schedule + check-in, persisted to localStorage. */
export function useDayRecord(userId?: string) {
  const [db, setDb] = useState<DB>(() => loadDB());
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const lastUpdate = useRef<((d: DayRecord) => DayRecord) | null>(null);
  const key = localDayKey();
  const day = db[key] ?? emptyDay();

  useEffect(() => {
    if (!userId || !supabase) return;
    void supabase.from("day_records").select("day_key, record").eq("user_id", userId).then(({ data }) => {
      if (!data) return;
      setDb((previous) => {
        const next = { ...previous };
        for (const row of data) next[row.day_key as string] = row.record as DayRecord;
        saveDB(next);
        return next;
      });
    });
  }, [userId]);

  const update = useCallback(
    async (updater: (d: DayRecord) => DayRecord) => {
      lastUpdate.current = updater;
      setSaveState("saving");
      let record: DayRecord | undefined;
      let nextDb: DB | undefined;
      try {
        setDb((prev) => {
          nextDb = { ...prev, [key]: updater(prev[key] ?? emptyDay()) };
          record = nextDb[key];
          saveInternalBackup(prev, "Before saving schedule or uploaded day");
          saveDB(nextDb);
          return nextDb;
        });
        if (userId && supabase && record) {
          const { error } = await supabase
            .from("day_records")
            .upsert({ user_id: userId, day_key: key, record }, { onConflict: "user_id,day_key" });
          if (error) throw error;
        }
        setSaveState("saved");
      } catch (error) {
        console.error("Gradient save failed", error);
        setSaveState("error");
        throw error;
      }
    },
    [key, userId],
  );

  const retrySave = useCallback(async () => {
    if (lastUpdate.current) await update(lastUpdate.current);
  }, [update]);

  const addBlock = useCallback(
    (block: Omit<ScheduleBlock, "id" | "done">) => {
      update((d) => ({
        ...d,
        blocks: [...d.blocks, { ...block, id: crypto.randomUUID(), done: false }],
      }));
    },
    [update],
  );

  const addBlocks = useCallback(
    (blocks: Array<Omit<ScheduleBlock, "id" | "done">>) => {
      update((d) => ({
        ...d,
        blocks: [...d.blocks, ...blocks.map((block) => ({ ...block, id: crypto.randomUUID(), done: false }))],
      }));
    },
    [update],
  );

  const toggleBlock = useCallback(
    (id: string) => {
      update((d) => ({
        ...d,
        blocks: d.blocks.map((b) => (b.id === id ? { ...b, done: !b.done } : b)),
      }));
    },
    [update],
  );

  const deleteBlock = useCallback(
    (id: string) => {
      update((d) => ({ ...d, blocks: d.blocks.filter((b) => b.id !== id) }));
    },
    [update],
  );

  const updateBlock = useCallback(
    (id: string, patch: Partial<Omit<ScheduleBlock, "id">>) => {
      update((d) => ({ ...d, blocks: d.blocks.map((block) => block.id === id ? { ...block, ...patch } : block) }));
    },
    [update],
  );

  const replaceBlocks = useCallback(
    (blocks: ScheduleBlock[]) => update((d) => ({ ...d, blocks })),
    [update],
  );

  const saveCheckin = useCallback(
    (checkin: CheckIn) => {
      update((d) => ({ ...d, checkin }));
    },
    [update],
  );

  const addReminder = useCallback(
    (reminder: Omit<Reminder, "id">) => {
      update((d) => ({
        ...d,
        reminders: [...(d.reminders ?? []), { ...reminder, id: crypto.randomUUID() }],
      }));
    },
    [update],
  );

  const deleteReminder = useCallback(
    (id: string) => {
      update((d) => ({ ...d, reminders: (d.reminders ?? []).filter((reminder) => reminder.id !== id) }));
    },
    [update],
  );

  const addImport = useCallback(
    (entry: Omit<ImportedEntry, "id" | "createdAt">) => {
      update((d) => ({
        ...d,
        imports: [...(d.imports ?? []), { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() }],
      }));
    },
    [update],
  );

  const deleteImport = useCallback(
    (id: string) => update((d) => ({ ...d, imports: (d.imports ?? []).filter((entry) => entry.id !== id) })),
    [update],
  );

  const updateImport = useCallback(
    (id: string, blocks: ImportedEntry["blocks"]) => update((d) => ({ ...d, imports: (d.imports ?? []).map((entry) => entry.id === id ? { ...entry, blocks } : entry) })),
    [update],
  );

  /** Consecutive days ending today where every scheduled block was completed. */
  const streak = useCallback((): number => {
    let count = 0;
    const d = new Date();
    for (;;) {
      const k = localDayKey(d);
      const rec = db[k];
      if (rec && rec.blocks.length > 0 && rec.blocks.every((b) => b.done)) {
        count += 1;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [db]);

  const imports = Object.values(db).flatMap((record) => record.imports ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { day, imports, addBlock, addBlocks, toggleBlock, deleteBlock, updateBlock, replaceBlocks, saveCheckin, addReminder, deleteReminder, addImport, deleteImport, updateImport, streak, saveState, retrySave };
}
