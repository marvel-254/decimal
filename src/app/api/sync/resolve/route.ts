import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { resolveConflict } from "@/lib/services/sync";
import { requireSchoolContext } from "@/lib/services/tenant";

/**
 * Resolve a sync conflict reported by the client.
 * body: { table: "attendance" | "marks", choice: "server" | "client", conflict: {...} }
 */
export async function POST(request: Request) {
  const rl = await rateLimit(request, { maxRequests: 30, windowMs: 60_000, prefix: "sync-resolve" });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { table, choice, conflict } = body ?? {};

  if (table !== "attendance" && table !== "marks") {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }
  if (choice !== "server" && choice !== "client") {
    return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
  }
  if (!conflict || typeof conflict !== "object") {
    return NextResponse.json({ error: "Missing conflict" }, { status: 400 });
  }

  try {
    // The conflict payload's server row id comes from the browser, so the
    // write must be scoped to the caller's active school rather than relying
    // on the id alone.
    const { schoolId } = await requireSchoolContext(user.id);
    const { resolved } = await resolveConflict(supabase, schoolId, table, choice, conflict);
    if (!resolved) return NextResponse.json({ error: "Invalid conflict payload" }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Resolve failed" },
      { status: 500 }
    );
  }
}
