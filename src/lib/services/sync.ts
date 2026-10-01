import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Conflict-aware offline sync core.
 *
 * Replaces the old last-write-wins upserts: when a client record would
 * overwrite a server row that changed after the client edited it, the server
 * returns a conflict (HTTP 409) listing both versions for the user to resolve,
 * instead of silently clobbering the server value.
 */

export type SyncConflict = {
  table: "attendance" | "marks";
  // Natural key of the row, used by the client to find its local copy.
  key: Record<string, string>;
  client: Record<string, unknown>;
  server: Record<string, unknown>;
};

export type SyncResult = {
  synced: number;
  skipped: number;
  conflicts: SyncConflict[];
};

const ATTENDANCE_STATUSES = new Set(["present", "absent", "late", "excused"]);

export function isAttendanceRecord(
  r: Record<string, unknown>
): r is {
  id: string;
  student_id: string;
  date: string;
  status: string;
  school_id?: unknown;
  notes?: unknown;
  class_id?: unknown;
  _synced_at?: unknown;
} {
  return (
    typeof r.id === "string" &&
    typeof r.student_id === "string" &&
    typeof r.date === "string" &&
    typeof r.status === "string" &&
    ATTENDANCE_STATUSES.has(r.status)
  );
}

export function isMarkRecord(
  r: Record<string, unknown>
): r is {
  id: string;
  exam_id: string;
  student_id: string;
  subject_id: string;
  score: number;
  _synced_at?: unknown;
} {
  return (
    typeof r.id === "string" &&
    typeof r.exam_id === "string" &&
    typeof r.student_id === "string" &&
    typeof r.subject_id === "string" &&
    typeof r.score === "number" &&
    r.score >= 0 &&
    r.score <= 100
  );
}

function parseDate(value: unknown): number {
  const t = typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Client-supplied edit timestamps are trusted only if they're plausible:
 * parseable and not in the future (a skewed/lying clock must not let a
 * device win every future conflict). Returns undefined to fall back to now().
 */
function sanitizeSyncedAt(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = Date.parse(value);
  if (Number.isNaN(t) || t > Date.now() + 5 * 60_000) return undefined;
  return new Date(t).toISOString();
}

type AttendanceRow = {
  id: string;
  student_id: string;
  date: string;
  status: string;
  notes: string | null;
  class_id: string | null;
  updated_at: string;
};

/**
 * Sync offline attendance records into the active school.
 * `records` are the client's unsynced offline records (which carry a
 * `_synced_at` ISO timestamp of when they were last edited on-device).
 */
export async function syncAttendanceRecords(
  supabase: SupabaseClient,
  schoolId: string,
  userId: string,
  rawRecords: Record<string, unknown>[]
): Promise<SyncResult> {
  const records = rawRecords.filter(isAttendanceRecord);
  let skipped = rawRecords.length - records.length;

  // Fetch existing rows for the batch in one query, keyed by (student_id, date).
  const studentIds = [...new Set(records.map((r) => r.student_id))];
  const existingByKey = new Map<string, AttendanceRow>();
  if (studentIds.length > 0) {
    const { data } = await supabase
      .from("attendance_records")
      .select("id, student_id, date, status, notes, class_id, updated_at")
      .eq("school_id", schoolId)
      .in("student_id", studentIds);
    for (const row of (data ?? []) as AttendanceRow[]) {
      existingByKey.set(`${row.student_id}|${row.date}`, row);
    }
  }

  const inserts: Record<string, unknown>[] = [];
  const conflicts: SyncConflict[] = [];
  let synced = 0;

  for (const r of records) {
    // A stale record cached from a different school must never land in the
    // active school — drop it.
    if (typeof r.school_id === "string" && r.school_id !== schoolId) {
      skipped++;
      continue;
    }

    const key = `${r.student_id}|${r.date}`;
    const server = existingByKey.get(key);

    if (!server) {
      inserts.push({
        id: r.id,
        school_id: schoolId,
        student_id: r.student_id,
        date: r.date,
        status: r.status,
        notes: typeof r.notes === "string" ? r.notes : null,
        class_id: typeof r.class_id === "string" ? r.class_id : null,
        recorded_by: userId,
        updated_at: sanitizeSyncedAt(r._synced_at),
      });
      synced++;
      continue;
    }

    const clientEditedAt = parseDate(sanitizeSyncedAt(r._synced_at));
    const serverUpdatedAt = parseDate(server.updated_at);

    if (clientEditedAt > serverUpdatedAt) {
      // Client edited after the server's last change — client wins.
      // Scope by school_id as well as id: `server.id` came back from a
      // school-filtered select, but re-asserting it here means a widened RLS
      // policy can never turn this into a cross-tenant write.
      const { error } = await supabase
        .from("attendance_records")
        .update({
          status: r.status,
          notes: typeof r.notes === "string" ? r.notes : server.notes,
          class_id: typeof r.class_id === "string" ? r.class_id : server.class_id,
        })
        .eq("id", server.id)
        .eq("school_id", schoolId);
      if (error) throw new Error(error.message);
      existingByKey.set(key, { ...server, status: r.status });
      synced++;
    } else {
      // Server changed after the client's edit — do not overwrite silently.
      conflicts.push({
        table: "attendance",
        key: { student_id: r.student_id, date: r.date },
        client: { id: r.id, status: r.status, notes: r.notes ?? null, updated_at: r._synced_at ?? null },
        server: { id: server.id, status: server.status, notes: server.notes, updated_at: server.updated_at },
      });
    }
  }

  if (inserts.length > 0) {
    const { error } = await supabase.from("attendance_records").insert(inserts);
    if (error) throw new Error(error.message);
  }

  return { synced, skipped, conflicts };
}

type MarkRow = {
  id: string;
  exam_id: string;
  student_id: string;
  subject_id: string;
  score: number;
  updated_at: string;
};

/** Sync offline exam-result records into the active school. */
export async function syncMarkRecords(
  supabase: SupabaseClient,
  schoolId: string,
  userId: string,
  rawRecords: Record<string, unknown>[]
): Promise<SyncResult> {
  const records = rawRecords.filter(isMarkRecord);
  let skipped = rawRecords.length - records.length;

  const examIds = [...new Set(records.map((r) => r.exam_id))];
  const existingByKey = new Map<string, MarkRow>();
  // exam_ids that actually belong to the active school. A record naming an
  // exam from another school must be dropped, not inserted — otherwise the
  // insert branch below would try to write a cross-tenant result and rely on
  // RLS alone to stop it.
  const allowedExamIds = new Set<string>();
  if (examIds.length > 0) {
    const { data: exams, error: examsError } = await supabase
      .from("exams")
      .select("id")
      .eq("school_id", schoolId)
      .in("id", examIds);
    // Surface a failed lookup rather than dropping records: these stay queued
    // for the next attempt instead of being discarded as cross-tenant.
    if (examsError) throw new Error(examsError.message);
    for (const exam of (exams ?? []) as { id: string }[]) {
      allowedExamIds.add(exam.id);
    }

    // Join through exams so the read is scoped to the active school —
    // exam_results itself has no school_id column.
    const { data } = await supabase
      .from("exam_results")
      .select("id, exam_id, student_id, subject_id, score, updated_at, exams!inner(school_id)")
      .in("exam_id", examIds)
      .eq("exams.school_id", schoolId);
    for (const row of (data ?? []) as MarkRow[]) {
      existingByKey.set(`${row.exam_id}|${row.student_id}|${row.subject_id}`, row);
    }
  }

  const inserts: Record<string, unknown>[] = [];
  const conflicts: SyncConflict[] = [];
  let synced = 0;

  for (const r of records) {
    // Same cross-tenant guard as attendance: a record naming an exam the
    // active school does not own must be dropped, never inserted.
    if (!allowedExamIds.has(r.exam_id)) {
      skipped++;
      continue;
    }

    const key = `${r.exam_id}|${r.student_id}|${r.subject_id}`;
    const server = existingByKey.get(key);

    if (!server) {
      inserts.push({
        id: r.id,
        exam_id: r.exam_id,
        student_id: r.student_id,
        subject_id: r.subject_id,
        score: r.score,
        recorded_by: userId,
        updated_at: sanitizeSyncedAt(r._synced_at),
      });
      synced++;
      continue;
    }

    const clientEditedAt = parseDate(sanitizeSyncedAt(r._synced_at));
    const serverUpdatedAt = parseDate(server.updated_at);

    if (clientEditedAt > serverUpdatedAt) {
      const { error } = await supabase
        .from("exam_results")
        .update({ score: r.score })
        .eq("id", server.id);
      if (error) throw new Error(error.message);
      existingByKey.set(key, { ...server, score: r.score });
      synced++;
    } else {
      conflicts.push({
        table: "marks",
        key: { exam_id: r.exam_id, student_id: r.student_id, subject_id: r.subject_id },
        client: { id: r.id, score: r.score, updated_at: r._synced_at ?? null },
        server: { id: server.id, score: server.score, updated_at: server.updated_at },
      });
    }
  }

  if (inserts.length > 0) {
    const { error } = await supabase.from("exam_results").insert(inserts);
    if (error) throw new Error(error.message);
  }

  return { synced, skipped, conflicts };
}

/**
 * Resolve a conflict: "server" keeps the server value (client just forgets its
 * local edit), "client" overwrites the server row with the client's value.
 *
 * `schoolId` is required and every write is scoped to it. `conflict.server.id`
 * arrives from the browser, so without this a crafted payload could aim the
 * update at any row in the instance — the write would be blocked only by RLS.
 */
export async function resolveConflict(
  supabase: SupabaseClient,
  schoolId: string,
  table: "attendance" | "marks",
  choice: "server" | "client",
  conflict: SyncConflict
): Promise<{ resolved: boolean }> {
  if (choice === "server") return { resolved: true };

  if (table === "attendance") {
    const status = conflict.client.status;
    const serverId = conflict.server.id;
    if (typeof status !== "string" || !ATTENDANCE_STATUSES.has(status) || typeof serverId !== "string") {
      return { resolved: false };
    }
    const { error } = await supabase
      .from("attendance_records")
      .update({ status })
      .eq("id", serverId)
      .eq("school_id", schoolId);
    if (error) throw new Error(error.message);
    return { resolved: true };
  }

  const score = conflict.client.score;
  const serverId = conflict.server.id;
  if (typeof score !== "number" || score < 0 || score > 100 || typeof serverId !== "string") {
    return { resolved: false };
  }

  // exam_results carries no school_id — tenancy runs through exams.school_id.
  // Resolve the owning exam first so the update below can be school-scoped.
  const { data: result, error: lookupError } = await supabase
    .from("exam_results")
    .select("id, exam_id, exams!inner(school_id)")
    .eq("id", serverId)
    .eq("exams.school_id", schoolId)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);
  if (!result) return { resolved: false };

  const { error } = await supabase.from("exam_results").update({ score }).eq("id", serverId);
  if (error) throw new Error(error.message);
  return { resolved: true };
}
