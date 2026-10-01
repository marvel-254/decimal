import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  syncAttendanceRecords,
  syncMarkRecords,
  resolveConflict,
  isAttendanceRecord,
  isMarkRecord,
} from "@/lib/services/sync";

/**
 * Minimal chainable stub of the Supabase query builder. Each table gets a
 * queue of canned responses consumed in call order.
 */
function makeSupabaseStub(tableResponses: Record<string, object[]>) {
  const builders = new Map<string, ReturnType<typeof build>>();

  function build(table: string) {
    const state: {
      filters: Record<string, unknown>;
      updatePayload: Record<string, unknown> | null;
      insertPayload: Record<string, unknown>[] | null;
    } = {
      filters: {},
      updatePayload: null,
      insertPayload: null,
    };

    const builder: Record<string, unknown> = {
      select: vi.fn(() => builder),
      insert: vi.fn((rows: Record<string, unknown>[]) => {
        state.insertPayload = rows;
        return builder;
      }),
      update: vi.fn((payload: Record<string, unknown>) => {
        state.updatePayload = payload;
        return builder;
      }),
      eq: vi.fn((col: string, val: unknown) => {
        state.filters[col] = val;
        return builder;
      }),
      in: vi.fn((col: string, vals: unknown[]) => {
        state.filters[col] = vals;
        return builder;
      }),
      maybeSingle: vi.fn(() => builder),
      then(resolve: (v: unknown) => void) {
        const queue = tableResponses[table] ?? [];
        const response = queue.length > 0 ? queue.shift()! : { data: [], error: null };
        // Emulate an error on insert/update by echoing it once.
        resolve(response);
      },
      // expose state for assertions
      __state: state,
    };
    return builder;
  }

  return {
    from: vi.fn((table: string) => {
      let b = builders.get(table);
      if (!b) {
        b = build(table);
        builders.set(table, b);
      }
      return b;
    }),
  };
}

const SCHOOL = "school-1";
const USER = "user-1";

describe("sync record validation", () => {
  it("rejects attendance records with invalid status", () => {
    expect(isAttendanceRecord({ id: "a", student_id: "s", date: "2026-01-01", status: "skipping" })).toBe(false);
  });

  it("accepts valid attendance records", () => {
    expect(isAttendanceRecord({ id: "a", student_id: "s", date: "2026-01-01", status: "present" })).toBe(true);
  });

  it("rejects marks outside 0–100", () => {
    expect(isMarkRecord({ id: "m", exam_id: "e", student_id: "s", subject_id: "sub", score: 140 })).toBe(false);
    expect(isMarkRecord({ id: "m", exam_id: "e", student_id: "s", subject_id: "sub", score: -1 })).toBe(false);
  });

  it("accepts valid marks", () => {
    expect(isMarkRecord({ id: "m", exam_id: "e", student_id: "s", subject_id: "sub", score: 88.5 })).toBe(true);
  });
});

describe("syncAttendanceRecords", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts a new record and stamps recorded_by with the server user", async () => {
    const supabase = makeSupabaseStub({
      attendance_records: [{ data: [], error: null }],
    });
    const result = await syncAttendanceRecords(
      supabase as never,
      SCHOOL,
      USER,
      [{ id: "local-1", student_id: "s1", date: "2026-01-05", status: "present", _synced_at: "2026-01-05T10:00:00Z" }]
    );

    expect(result.synced).toBe(1);
    expect(result.conflicts).toHaveLength(0);

    const from = supabase.from("attendance_records");
    expect(from.insert).toHaveBeenCalledWith([
      expect.objectContaining({ school_id: SCHOOL, recorded_by: USER, student_id: "s1" }),
    ]);
  });

  it("reports a conflict instead of overwriting a newer server row", async () => {
    const serverUpdatedAt = "2026-01-05T12:00:00Z";
    const supabase = makeSupabaseStub({
      attendance_records: [{ data: [{ id: "srv-1", student_id: "s1", date: "2026-01-05", status: "absent", notes: null, class_id: null, updated_at: serverUpdatedAt }], error: null }],
    });
    const result = await syncAttendanceRecords(
      supabase as never,
      SCHOOL,
      USER,
      // client edited BEFORE the server change
      [{ id: "local-1", student_id: "s1", date: "2026-01-05", status: "late", _synced_at: "2026-01-05T09:00:00Z" }]
    );

    expect(result.synced).toBe(0);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].client.status).toBe("late");
    expect(result.conflicts[0].server.status).toBe("absent");
    expect(result.conflicts[0].server.id).toBe("srv-1");
  });

  it("lets the client win when it edited after the server's last change", async () => {
    const supabase = makeSupabaseStub({
      attendance_records: [
        { data: [{ id: "srv-1", student_id: "s1", date: "2026-01-05", status: "absent", notes: null, class_id: null, updated_at: "2026-01-05T08:00:00Z" }], error: null },
        { data: null, error: null }, // update response
      ],
    });
    const result = await syncAttendanceRecords(
      supabase as never,
      SCHOOL,
      USER,
      [{ id: "local-1", student_id: "s1", date: "2026-01-05", status: "present", _synced_at: "2026-01-05T10:00:00Z" }]
    );

    expect(result.synced).toBe(1);
    expect(result.conflicts).toHaveLength(0);
  });

  it("drops records from a different school (cross-tenant guard)", async () => {
    const supabase = makeSupabaseStub({
      attendance_records: [{ data: [], error: null }],
    });
    const result = await syncAttendanceRecords(
      supabase as never,
      SCHOOL,
      USER,
      [{ id: "local-1", student_id: "s1", date: "2026-01-05", status: "present", school_id: "school-OTHER", _synced_at: "2026-01-05T10:00:00Z" }]
    );

    expect(result.synced).toBe(0);
    expect(result.skipped).toBe(1);
    expect(supabase.from("attendance_records").insert).not.toHaveBeenCalled();
  });

  it("ignores future client timestamps (skewed clock guard)", async () => {
    // Server changed at T; client claims an edit from the far future.
    const supabase = makeSupabaseStub({
      attendance_records: [{ data: [{ id: "srv-1", student_id: "s1", date: "2026-01-05", status: "absent", notes: null, class_id: null, updated_at: "2026-01-05T08:00:00Z" }], error: null }],
    });
    const result = await syncAttendanceRecords(
      supabase as never,
      SCHOOL,
      USER,
      [{ id: "local-1", student_id: "s1", date: "2026-01-05", status: "present", _synced_at: "2030-01-01T00:00:00Z" }]
    );

    // Future timestamp is sanitized to "now", which is not > server time ⇒ conflict.
    expect(result.conflicts).toHaveLength(1);
  });
});

describe("syncMarkRecords", () => {
  it("reports a conflict instead of overwriting a newer server score", async () => {
    const supabase = makeSupabaseStub({
      exams: [{ data: [{ id: "e1" }], error: null }],
      exam_results: [{ data: [{ id: "srv-1", exam_id: "e1", student_id: "s1", subject_id: "sub1", score: 75, updated_at: "2026-01-05T12:00:00Z" }], error: null }],
    });
    const result = await syncMarkRecords(
      supabase as never,
      SCHOOL,
      USER,
      [{ id: "local-1", exam_id: "e1", student_id: "s1", subject_id: "sub1", score: 90, _synced_at: "2026-01-05T09:00:00Z" }]
    );

    expect(result.synced).toBe(0);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].server.score).toBe(75);
    expect(result.conflicts[0].client.score).toBe(90);
  });

  it("drops marks for an exam belonging to another school (cross-tenant guard)", async () => {
    const supabase = makeSupabaseStub({
      // The school owns no exam with this id.
      exams: [{ data: [], error: null }],
      exam_results: [{ data: [], error: null }],
    });
    const result = await syncMarkRecords(
      supabase as never,
      SCHOOL,
      USER,
      [{ id: "local-1", exam_id: "exam-OTHER-SCHOOL", student_id: "s1", subject_id: "sub1", score: 90, _synced_at: "2026-01-05T09:00:00Z" }]
    );

    expect(result.synced).toBe(0);
    expect(result.skipped).toBe(1);
    expect(supabase.from("exam_results").insert).not.toHaveBeenCalled();
  });
});

describe("resolveConflict", () => {
  it("keeping the server value is a no-op", async () => {
    const supabase = makeSupabaseStub({});
    const { resolved } = await resolveConflict(supabase as never, SCHOOL, "attendance", "server", {
      table: "attendance",
      key: {},
      client: {},
      server: {},
    });
    expect(resolved).toBe(true);
    expect(supabase.from("attendance_records").update).not.toHaveBeenCalled();
  });

  it("choosing the client overwrites the server row with validated values", async () => {
    const supabase = makeSupabaseStub({
      attendance_records: [{ data: null, error: null }],
    });
    const { resolved } = await resolveConflict(supabase as never, SCHOOL, "attendance", "client", {
      table: "attendance",
      key: {},
      client: { status: "present" },
      server: { id: "srv-1" },
    });
    expect(resolved).toBe(true);
    expect(supabase.from("attendance_records").update).toHaveBeenCalledWith({ status: "present" });
  });

  it("rejects invalid client values instead of writing them", async () => {
    const supabase = makeSupabaseStub({});
    const { resolved } = await resolveConflict(supabase as never, SCHOOL, "marks", "client", {
      table: "marks",
      key: {},
      client: { score: 999 },
      server: { id: "srv-1" },
    });
    expect(resolved).toBe(false);
    expect(supabase.from("exam_results").update).not.toHaveBeenCalled();
  });

  it("scopes the attendance write to the active school", async () => {
    const supabase = makeSupabaseStub({
      attendance_records: [{ data: null, error: null }],
    });
    await resolveConflict(supabase as never, SCHOOL, "attendance", "client", {
      table: "attendance",
      key: {},
      client: { status: "present" },
      server: { id: "srv-1" },
    });

    // The server row id arrives from the browser, so the update must also be
    // filtered by school_id — otherwise a crafted payload could aim the write
    // at any row in the instance.
    const builder = supabase.from("attendance_records");
    expect(builder.update).toHaveBeenCalledWith({ status: "present" });
    expect(builder.eq).toHaveBeenCalledWith("id", "srv-1");
    expect(builder.eq).toHaveBeenCalledWith("school_id", SCHOOL);
  });

  it("refuses to amend a mark belonging to another school", async () => {
    // The ownership lookup finds no exam_results row in this school.
    const supabase = makeSupabaseStub({
      exam_results: [{ data: null, error: null }],
    });
    const { resolved } = await resolveConflict(supabase as never, SCHOOL, "marks", "client", {
      table: "marks",
      key: {},
      client: { score: 90 },
      server: { id: "srv-OTHER-SCHOOL" },
    });

    expect(resolved).toBe(false);
    expect(supabase.from("exam_results").update).not.toHaveBeenCalled();
  });

  it("amends a mark once the exam is confirmed to be in the active school", async () => {
    const supabase = makeSupabaseStub({
      exam_results: [
        { data: { id: "srv-1", exam_id: "e1", exams: { school_id: SCHOOL } }, error: null },
        { data: null, error: null }, // update response
      ],
    });
    const { resolved } = await resolveConflict(supabase as never, SCHOOL, "marks", "client", {
      table: "marks",
      key: {},
      client: { score: 90 },
      server: { id: "srv-1" },
    });

    expect(resolved).toBe(true);
    expect(supabase.from("exam_results").update).toHaveBeenCalledWith({ score: 90 });
  });
});
