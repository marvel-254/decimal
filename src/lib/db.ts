import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "decimal-offline";
const DB_VERSION = 2;

export interface OfflineAttendance {
  id: string;
  school_id: string;
  class_id: string | null;
  date: string;
  student_id: string;
  status: "present" | "absent" | "late" | "excused";
  notes?: string | null;
  recorded_by: string;
  synced: boolean;
  created_at: string;
  /** ISO timestamp of the last on-device edit; used for sync conflict detection. */
  _synced_at: string;
}

export interface OfflineMark {
  id: string;
  school_id: string;
  exam_id: string;
  student_id: string;
  subject_id: string;
  score: number;
  recorded_by: string;
  synced: boolean;
  created_at: string;
  /** ISO timestamp of the last on-device edit; used for sync conflict detection. */
  _synced_at: string;
}

export interface SyncQueueItem {
  id: string;
  table: string;
  operation: "insert" | "update" | "delete";
  data: Record<string, unknown>;
  created_at: string;
  retries: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Attendance store
        if (!db.objectStoreNames.contains("attendance")) {
          const attendanceStore = db.createObjectStore("attendance", { keyPath: "id" });
          attendanceStore.createIndex("by-school", "school_id");
          attendanceStore.createIndex("by-synced", "synced");
          attendanceStore.createIndex("by-date", "date");
        }

        // Marks store
        if (!db.objectStoreNames.contains("marks")) {
          const marksStore = db.createObjectStore("marks", { keyPath: "id" });
          marksStore.createIndex("by-school", "school_id");
          marksStore.createIndex("by-synced", "synced");
          marksStore.createIndex("by-exam", "exam_id");
        }

        // Timetable cache
        if (!db.objectStoreNames.contains("timetable")) {
          db.createObjectStore("timetable", { keyPath: "id" });
        }

        // Student cache
        if (!db.objectStoreNames.contains("students")) {
          const studentsStore = db.createObjectStore("students", { keyPath: "id" });
          studentsStore.createIndex("by-school", "school_id");
        }

        // Sync queue
        if (!db.objectStoreNames.contains("sync-queue")) {
          const syncStore = db.createObjectStore("sync-queue", { keyPath: "id" });
          syncStore.createIndex("by-created", "created_at");
        }

        // v2: conflicts reported by the server during sync
        if (oldVersion < 2 && !db.objectStoreNames.contains("conflicts")) {
          const conflictsStore = db.createObjectStore("conflicts", { keyPath: "id" });
          conflictsStore.createIndex("by-table", "table");
          conflictsStore.createIndex("by-created", "created_at");
        }
      },
    });
  }
  return dbPromise;
}

// Attendance operations
//
// The record is queued implicitly: it lands in the `attendance` store with
// synced = 0 and syncPendingData drains that store through the by-synced
// index. It used to ALSO push an explicit row into "sync-queue", which
// double-sent every record on the weakest connections.
export async function saveAttendance(record: OfflineAttendance) {
  const db = await getDB();
  const stamped = { ...record, _synced_at: new Date().toISOString() };
  await db.put("attendance", stamped);
}

export async function getUnsyncedAttendance() {
  const db = await getDB();
  return db.getAllFromIndex("attendance", "by-synced", IDBKeyRange.only(0));
}

export async function markAttendanceSynced(ids: string[]) {
  const db = await getDB();
  const tx = db.transaction("attendance", "readwrite");
  for (const id of ids) {
    const record = await tx.store.get(id);
    if (record) {
      record.synced = 1;
      await tx.store.put(record);
    }
  }
  await tx.done;
}

// Marks operations
export async function saveMark(record: OfflineMark) {
  const db = await getDB();
  const stamped = { ...record, _synced_at: new Date().toISOString() };
  await db.put("marks", stamped);
}

export async function getUnsyncedMarks() {
  const db = await getDB();
  return db.getAllFromIndex("marks", "by-synced", IDBKeyRange.only(0));
}

export async function markMarksSynced(ids: string[]) {
  const db = await getDB();
  const tx = db.transaction("marks", "readwrite");
  for (const id of ids) {
    const record = await tx.store.get(id);
    if (record) {
      record.synced = 1;
      await tx.store.put(record);
    }
  }
  await tx.done;
}

// Timetable cache
export async function cacheTimetable(data: Record<string, unknown>[]) {
  const db = await getDB();
  const tx = db.transaction("timetable", "readwrite");
  await tx.store.clear();
  for (const item of data) {
    await tx.store.put(item);
  }
  await tx.done;
}

export async function getCachedTimetable() {
  const db = await getDB();
  return db.getAll("timetable");
}

// Student cache
export async function cacheStudents(data: Record<string, unknown>[]) {
  const db = await getDB();
  const tx = db.transaction("students", "readwrite");
  await tx.store.clear();
  for (const item of data) {
    await tx.store.put(item);
  }
  await tx.done;
}

export async function getCachedStudents() {
  const db = await getDB();
  return db.getAll("students");
}

// Conflicts (server-reported during sync)
export interface OfflineConflict {
  id: string;
  table: "attendance" | "marks";
  key: Record<string, string>;
  client: Record<string, unknown>;
  server: Record<string, unknown>;
  created_at: string;
}

export async function saveConflict(conflict: Omit<OfflineConflict, "id" | "created_at">) {
  const db = await getDB();
  await db.put("conflicts", {
    ...conflict,
    id: `${conflict.table}-${Object.values(conflict.key).join("-")}`,
    created_at: new Date().toISOString(),
  });
}

export async function getConflicts(): Promise<OfflineConflict[]> {
  const db = await getDB();
  return db.getAll("conflicts");
}

export async function getConflictCount(): Promise<number> {
  const db = await getDB();
  return db.count("conflicts");
}

export async function removeConflict(id: string) {
  const db = await getDB();
  await db.delete("conflicts", id);
}

// Sync queue
//
// Legacy queue, retained so the IndexedDB schema version stays valid for
// existing installs. Nothing enqueues here any more: saveAttendance/saveMark
// queue implicitly via the attendance/marks `by-synced` indexes, and the old
// explicit pushes double-sent every record using a payload shape the sync
// endpoints reject — so this queue never drained and the badge never cleared.

export async function getSyncQueue() {
  const db = await getDB();
  return db.getAll("sync-queue");
}

export async function removeSyncQueueItem(id: string) {
  const db = await getDB();
  await db.delete("sync-queue", id);
}

export async function clearSyncQueue() {
  const db = await getDB();
  await db.clear("sync-queue");
}

/**
 * Number of records still waiting to reach the server.
 *
 * Counts unsynced attendance and marks — the real backlog — plus anything left
 * in the legacy sync-queue, so the header badge reflects pending work instead
 * of an always-empty store.
 */
export async function getSyncQueueCount(): Promise<number> {
  const db = await getDB();
  const [attendance, marks, queued] = await Promise.all([
    db.countFromIndex("attendance", "by-synced", IDBKeyRange.only(0)),
    db.countFromIndex("marks", "by-synced", IDBKeyRange.only(0)),
    db.count("sync-queue"),
  ]);
  return attendance + marks + queued;
}
