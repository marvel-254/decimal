/**
 * Decimal Tuition — shared types (subset used by shell/identity; extended by
 * feature slices as they land).
 */
import type { ComponentType } from "react";

export type TuitionSpaceId = "learn" | "teach" | "assess" | "activities" | "network" | "school";
export type Tint = "learn" | "assess" | "activity" | "network" | "live" | "progress";

export type TuitionShellMode = "student" | "teacher" | "school" | "network";

export type ProgrammeStatus = "draft" | "published" | "archived";
export type EnrolmentStatus = "invited" | "active" | "completed" | "dropped";
export type LessonState = "locked" | "available" | "in_progress" | "completed";
export type AssignmentStatus = "draft" | "open" | "grading" | "closed";
export type SubmissionStatus = "draft" | "submitted" | "late" | "graded";
export type AssessmentStatus = "draft" | "scheduled" | "open" | "closed" | "published_results";
export type AttemptStatus = "not_started" | "in_progress" | "submitted" | "graded";
export type ActivityStatus = "draft" | "registrations" | "in_progress" | "results" | "completed" | "cancelled";
export type ResourceType = "video" | "pdf" | "document" | "audio" | "image" | "presentation" | "link" | "embed";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type QuestionType = "mcq" | "multi_select" | "true_false" | "short_answer" | "structured" | "essay" | "practical";

export interface TuitionNavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
}