import {
  getSyncQueue,
  removeSyncQueueItem,
  getUnsyncedAttendance,
  markAttendanceSynced,
  getUnsyncedMarks,
  markMarksSynced,
  saveConflict,
} from "./db";

let isSyncing = false;

export async function syncPendingData(): Promise<{ synced: number; failed: number }> {
  if (isSyncing) return { synced: 0, failed: 0 };
  isSyncing = true;

  let synced = 0;
  let failed = 0;

  try {
    // Sync attendance
    const unsyncedAttendance = await getUnsyncedAttendance();
    if (unsyncedAttendance.length > 0) {
      try {
        const res = await fetch("/api/sync/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records: unsyncedAttendance }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          // Conflicts mean the server changed after the device edited —
          // the server value won for now; the user resolves below.
          for (const c of data?.conflicts ?? []) {
            await saveConflict({ table: "attendance", key: c.key, client: c.client, server: c.server });
          }
          await markAttendanceSynced(unsyncedAttendance.map((r) => r.id));
          synced += data?.synced ?? unsyncedAttendance.length;
        } else {
          failed += unsyncedAttendance.length;
        }
      } catch {
        failed += unsyncedAttendance.length;
      }
    }

    // Sync marks
    const unsyncedMarks = await getUnsyncedMarks();
    if (unsyncedMarks.length > 0) {
      try {
        const res = await fetch("/api/sync/marks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records: unsyncedMarks }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          for (const c of data?.conflicts ?? []) {
            await saveConflict({ table: "marks", key: c.key, client: c.client, server: c.server });
          }
          await markMarksSynced(unsyncedMarks.map((r) => r.id));
          synced += data?.synced ?? unsyncedMarks.length;
        } else {
          failed += unsyncedMarks.length;
        }
      } catch {
        failed += unsyncedMarks.length;
      }
    }

// Drain any legacy sync-queue rows left by older builds. Nothing enqueues
    // here now — see the note in db.ts — but existing installs may still hold
    // entries, and those would otherwise pin the header badge forever.
    const queue = await getSyncQueue();
    for (const item of queue) {
      try {
        // The sync endpoints take { records: [...] }; the legacy queue stored
        // a single record.
        const res = await fetch(`/api/sync/${item.table}`, {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ records: [item.data] }),
        });
        if (res.ok) {
          await removeSyncQueueItem(item.id);
          synced++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }
  } finally {
    isSyncing = false;
  }

  return { synced, failed };
}

export function startBackgroundSync() {
  if (typeof window === "undefined") return;

  // Sync when coming online
  window.addEventListener("online", () => {
    console.log("[sync] Back online, syncing pending data...");
    syncPendingData();
  });

  // Periodic sync every 30 seconds when online
  setInterval(() => {
    if (navigator.onLine) {
      syncPendingData();
    }
  }, 30000);
}
