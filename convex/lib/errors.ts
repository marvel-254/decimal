/**
 * ConvexError code constants matching the migration error taxonomy
 * (docs/migration/PLAN.md). All Convex functions surface errors as
 * `new ConvexError({ code, message, data? })` so the client can branch on
 * `error.data.code`.
 */
import { ConvexError } from "convex/values";
import type { Value } from "convex/values";

export const ErrorCodes = {
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION: "VALIDATION",
  CONFLICT: "CONFLICT",
  EXTERNAL: "EXTERNAL",
  INTERNAL: "INTERNAL",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export type AppErrorData = {
  code: ErrorCode;
  message: string;
  data?: Value;
};

export function appError(code: ErrorCode, message: string, data?: Value): ConvexError<AppErrorData> {
  const payload: AppErrorData = { code, message };
  if (data !== undefined) payload.data = data;
  return new ConvexError(payload);
}

/** Shorthand helpers so call sites read as `throw unauthenticatedError()`. */
export const unauthenticatedError = (message = "You must be signed in.") =>
  appError("UNAUTHENTICATED", message);
export const forbiddenError = (message = "You do not have permission to do this.") =>
  appError("FORBIDDEN", message);
export const notFoundError = (message = "Not found.") => appError("NOT_FOUND", message);
export const validationError = (message = "Invalid input.") => appError("VALIDATION", message);
export const conflictError = (message = "This record already exists.") =>
  appError("CONFLICT", message);
export const externalError = (message = "An external service failed.") =>
  appError("EXTERNAL", message);
export const internalError = (message = "Internal error.") => appError("INTERNAL", message);