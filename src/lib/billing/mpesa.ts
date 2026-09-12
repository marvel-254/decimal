/**
 * M-Pesa Daraja API Integration
 *
 * Handles OAuth token management and STK Push (Lipa Na M-Pesa Online).
 * Documentation: https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
 */

import { PaymentError } from "@/lib/errors";

const MPESA_BASE_URL =
  process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get M-Pesa OAuth access token (cached for its TTL).
 */
export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) {
    throw new PaymentError("M-Pesa credentials not configured", "mpesa");
  }

  const credentials = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new PaymentError(`M-Pesa OAuth failed: ${text}`, "mpesa");
  }

  const data = await res.json();
  const expiresIn = (data.expires_in ?? 3599) as number;

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (expiresIn - 60) * 1000, // 60s buffer
  };

  return cachedToken.token;
}

/**
 * Format a Kenyan phone number to 254XXXXXXXXX format.
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("254")) return cleaned;
  if (cleaned.startsWith("07")) return `254${cleaned.slice(1)}`;
  if (cleaned.startsWith("+254")) return cleaned.slice(1);
  return cleaned;
}

/**
 * Initiate an M-Pesa STK Push (Lipa Na M-Pesa Online).
 *
 * @returns MerchantRequestID and CheckoutRequestID for tracking
 */
export async function initiateStkPush(params: {
  phone: string;
  amount: number;
  accountRef: string;
  description: string;
}): Promise<{
  merchantRequestId: string;
  checkoutRequestId: string;
  customerMessage: string;
}> {
  const token = await getAccessToken();

  const shortcode = process.env.MPESA_SHORT_CODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mpesa`
    : process.env.MPESA_CALLBACK_URL;

  if (!shortcode || !passkey || !callbackUrl) {
    throw new PaymentError(
      "M-Pesa configuration incomplete (shortcode, passkey, or callback URL)",
      "mpesa"
    );
  }

  // Generate timestamp: YYYYMMDDHHmmss
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");

  // Password: Base64(BusinessShortCode + Passkey + Timestamp)
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString(
    "base64"
  );

  const phone = formatPhone(params.phone);

  const res = await fetch(
    `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerBuyGoodsOnline",
        Amount: Math.ceil(params.amount), // Integer required
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: params.accountRef,
        TransactionDesc: params.description,
      }),
    }
  );

  const data = await res.json();

  if (data.ResponseCode !== "0") {
    throw new PaymentError(
      `STK Push failed: ${data.CustomerMessage || data.ResponseDescription || "Unknown error"}`,
      "mpesa"
    );
  }

  return {
    merchantRequestId: data.MerchantRequestID,
    checkoutRequestId: data.CheckoutRequestID,
    customerMessage: data.CustomerMessage || "Check your phone for M-Pesa prompt",
  };
}
