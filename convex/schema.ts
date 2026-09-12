/**
 * Decimal → Convex Wave-1 schema (auth + tenant core).
 * Target deployment: third-snail-415 (dev). See docs/migration/PLAN.md.
 *
 * NORMALIZATION DECISIONS
 * - Every tenant-owned table carries `organizationId` (v.id("organizations"));
 *   no frontend-only tenant filtering. Convex functions enforce the whole
 *   identity chain: WorkOS identity → users → memberships(org) → role → permission.
 * - Legacy Supabase rows are linked through `legacyId` (the old UUID as string);
 *   the old cohort stays readable in Supabase until parity passes (Wave 6).
 * - `name` is a single string on users/organizations. On staff/students we keep
 *   firstName/lastName (matches SQL). Do NOT add email/phone to staff — the
 *   legacy `staff` table has no such columns (AGENTS.md).
 * - Legacy `students.class_id` + `class_teachers` fold into the `enrollments`
 *   table (student ↔ class, term-scoped). Legacy `students.parent_user_id`
 *   folds into `studentGuardians` (guardian = a `users` doc with a parent
 *   membership; no separate `guardians` table in Wave 1).
 * - Dates stored as Convex numbers (epoch ms). JSONB columns become
 *   `v.record(v.string(), v.any())`. Money stays out of Wave 1 (Rails finance
 *   waves 3/6 parity) — fees/payments are NOT in this schema.
 * - Convex never re-encodes the `_id`/`_creationTime` system fields; they are
 *   implicit. Indexes are named by field order (Convex best practice).
 *
 * DENORMALIZATION
 * - membership.role lives on the membership (not copied onto staff/students).
 * - `status` appears on users/organizations/memberships/staff/students as the
 *   normalized replacement for `is_active`/school_status.
 *
 * INDEX NOTES
 * - Convex indexes are not uniqueness-enforcing in v1.45.0. `by_workosUserId`,
 *   `by_slug`, and `by_organizationId_admissionNumber` are lookup indexes;
 *   uniqueness must be checked in mutation/import code before insert.
 */
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Matches the legacy `member_role` enum (migrations/001 + 003: timetable_manager).
 */
export const memberRole = v.union(
  v.literal("super_admin"),
  v.literal("principal"),
  v.literal("teacher"),
  v.literal("finance"),
  v.literal("admissions_officer"),
  v.literal("secretary"),
  v.literal("parent"),
  v.literal("timetable_manager"),
);

export default defineSchema({
  /**
   * A person. `workosUserId` = the WorkOS `sub` claim (stable per identity).
   * `legacyId` = old Supabase `auth.users.id` for mapping during migration.
   */
  users: defineTable({
    workosUserId: v.string(),
    legacyId: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.string(),
    status: v.union(v.literal("active"), v.literal("invited"), v.literal("suspended")),
    avatarUrl: v.optional(v.string()),
  })
    .index("by_workosUserId", ["workosUserId"])
    .index("by_legacyId", ["legacyId"])
    .index("by_email", ["email"]),

  /**
   * A tenant (legacy `schools` row). Settings live in `organizationSettings`.
   */
  organizations: defineTable({
    legacyId: v.optional(v.string()),
    name: v.string(),
    slug: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("active"),
      v.literal("suspended"),
      v.literal("archived"),
    ),
    schoolType: v.optional(
      v.union(v.literal("public"), v.literal("private"), v.literal("international"), v.literal("other")),
    ),
    educationLevel: v.optional(
      v.union(v.literal("junior"), v.literal("senior"), v.literal("junior_senior")),
    ),
    country: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_legacyId", ["legacyId"]),

  /** Org ↦ user ↦ role (legacy `school_members`). */
  memberships: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: memberRole,
    status: v.union(v.literal("active"), v.literal("inactive")),
    legacyId: v.optional(v.string()),
    joinedAt: v.optional(v.number()),
  })
    .index("by_organizationId_userId", ["organizationId", "userId"])
    .index("by_userId", ["userId"])
    .index("by_organizationId_role", ["organizationId", "role"]),

  /**
   * Singleton-scoped config docs. v1.45.0 has no `roles`/`permissionLiterals`
   * tables, so role→permission data lives here (key "rbac"); the enforcement
   * map lives in lib/authz.ts and must stay in sync with this doc.
   */
  permissionsConfig: defineTable({
    key: v.union(v.literal("rbac"), v.literal("featureFlags")),
    permissionsByRole: v.record(v.string(), v.array(v.string())),
  }).index("by_key", ["key"]),

  /** Legacy `staff`. No email/phone columns (see AGENTS.md). */
  staff: defineTable({
    organizationId: v.id("organizations"),
    userId: v.optional(v.id("users")),
    legacyId: v.optional(v.string()),
    employeeNumber: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    role: memberRole,
    department: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_organizationId_role", ["organizationId", "role"])
    .index("by_userId", ["userId"])
    .index("by_legacyId", ["legacyId"]),

  /** Legacy `students` (class/scoped links extracted into `enrollments`). */
  students: defineTable({
    organizationId: v.id("organizations"),
    legacyId: v.optional(v.string()),
    admissionNumber: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.optional(v.number()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"))),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("alumni")),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_organizationId_admissionNumber", ["organizationId", "admissionNumber"])
    .index("by_legacyId", ["legacyId"]),

  /** student ↔ guardian(user) mapping; replaces `students.parent_user_id`. */
  studentGuardians: defineTable({
    organizationId: v.id("organizations"),
    studentId: v.id("students"),
    guardianUserId: v.id("users"),
    relationship: v.optional(
      v.union(v.literal("parent"), v.literal("guardian"), v.literal("other")),
    ),
    isPrimary: v.optional(v.boolean()),
    legacyId: v.optional(v.string()),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_studentId", ["studentId"])
    .index("by_guardianUserId", ["guardianUserId"])
    .index("by_studentId_guardianUserId", ["studentId", "guardianUserId"]),

  academicYears: defineTable({
    organizationId: v.id("organizations"),
    legacyId: v.optional(v.string()),
    name: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    isCurrent: v.boolean(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_organizationId_isCurrent", ["organizationId", "isCurrent"]),

  /** `is_current` naming preserved from legacy `terms`. */
  terms: defineTable({
    organizationId: v.id("organizations"),
    academicYearId: v.id("academicYears"),
    legacyId: v.optional(v.string()),
    name: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    isCurrent: v.boolean(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_academicYearId", ["academicYearId"])
    .index("by_organizationId_isCurrent", ["organizationId", "isCurrent"]),

  classes: defineTable({
    organizationId: v.id("organizations"),
    legacyId: v.optional(v.string()),
    name: v.string(),
    stream: v.optional(v.string()),
    capacity: v.optional(v.number()),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_organizationId_name", ["organizationId", "name"]),

  subjects: defineTable({
    organizationId: v.id("organizations"),
    legacyId: v.optional(v.string()),
    name: v.string(),
    code: v.optional(v.string()),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_organizationId_code", ["organizationId", "code"]),

  /** student ↔ class; replaces `students.class_id` + `class_teachers`. */
  enrollments: defineTable({
    organizationId: v.id("organizations"),
    studentId: v.id("students"),
    classId: v.id("classes"),
    academicYearId: v.optional(v.id("academicYears")),
    status: v.union(v.literal("active"), v.literal("withdrawn"), v.literal("completed")),
    legacyId: v.optional(v.string()),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_studentId_organizationId", ["studentId", "organizationId"])
    .index("by_classId_organizationId", ["classId", "organizationId"]),

  /** Per-org settings; singleton per organization. Mirrors school feature flags. */
  organizationSettings: defineTable({
    organizationId: v.id("organizations"),
    settings: v.record(v.string(), v.any()),
    onboardingProgress: v.optional(v.number()),
    curriculumSubjectsLoaded: v.optional(v.boolean()),
  }).index("by_organizationId", ["organizationId"]),

  /** Append-only (service/mutation code writes only, like legacy service-role). */
  auditLogs: defineTable({
    organizationId: v.id("organizations"),
    actorUserId: v.optional(v.id("users")),
    actorEmail: v.optional(v.string()),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
  })
    .index("by_organizationId_creationTime", ["organizationId", "_creationTime"])
    .index("by_actorUserId", ["actorUserId"])
    .index("by_action", ["action"]),
});