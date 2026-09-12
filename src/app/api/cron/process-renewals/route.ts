import { NextResponse } from "next/server";
import { processRenewals } from "@/lib/billing/renewal";

/**
 * Cron endpoint: Process subscription renewals.
 *
 * Runs daily at 6am UTC via Vercel cron.
 * Protected by CRON_SECRET header.
 *
 * Initiates M-Pesa STK push for subscriptions past their next_billing_date.
 * Downgrades past_due subscriptions after 3-day grace period.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processRenewals();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[Cron] process-renewals error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
