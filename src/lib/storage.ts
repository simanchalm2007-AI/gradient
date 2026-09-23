import { useCallback, useEffect, useState } from "react";
import type { DayRecord, ScheduleBlock, CheckIn } from "../types";
import { supabase } from "./supabase";

const DB_KEY = "gradient_db";

type DB = Record<string, DayRecord>;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
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

function emptyDay(): DayRecord {
  return { blocks: [], checkin: {} };
}

/** Reads/writes today's schedule + check-in, persisted to localStorage. */
export function useDayRecord(userId?: string) {
  const [db, setDb] = useState<DB>(() => loadDB());
  const key = todayKey();
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
    (updater: (d: DayRecord) => DayRecord) => {
      setDb((prev) => {
        const next: DB = { ...prev, [key]: updater(prev[key] ?? emptyDay()) };
        saveDB(next);
        if (userId && supabase) {
          void supabase.from("day_records").upsert({ user_id: userId, day_key: key, record: next[key] }, { onConflict: "user_id,day_key" });
        }
        return next;
      });
    },
    [key, userId],
  );

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

  const saveCheckin = useCallback(
    (checkin: CheckIn) => {
      update((d) => ({ ...d, checkin }));
    },
    [update],
  );

  /** Consecutive days ending today where every scheduled block was completed. */
  const streak = useCallback((): number => {
    let count = 0;
    const d = new Date();
    for (;;) {
      const k = d.toISOString().slice(0, 10);
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

  return { day, addBlock, addBlocks, toggleBlock, deleteBlock, saveCheckin, streak };
}
