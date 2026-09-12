import { NextResponse } from "next/server";
import { processExpiredTrials } from "@/lib/billing/subscription";

/**
 * Cron endpoint: Process expired trials.
 *
 * Runs daily at 2am UTC via Vercel cron.
 * Protected by CRON_SECRET header.
 *
 * Downgrades trialing subscriptions past their trial_end to the Free tier.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await processExpiredTrials();
    return NextResponse.json({ ok: true, processed: count });
  } catch (err) {
    console.error("[Cron] process-trials error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
