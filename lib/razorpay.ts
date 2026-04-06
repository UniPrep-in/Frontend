import { createHmac, timingSafeEqual } from "node:crypto";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  notes?: {
    purchase_type?: string;
    user_id?: string;
    plan_id?: string;
    plan_name?: string;
    stream?: string;
    include_gat?: string;
    test_id?: string;
    test_title?: string;
    coupon_code?: string;
    coupon_id?: string;
    coupon_discount_type?: string;
    coupon_discount_value?: string;
    base_amount_paise?: string;
    discount_amount_paise?: string;
    final_amount_paise?: string;
    [key: string]: string | undefined;
  };
};

type RazorpayPaymentEntity = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  created_at?: number;
  notes?: {
    purchase_type?: string;
    user_id?: string;
    plan_id?: string;
    plan_name?: string;
    stream?: string;
    include_gat?: string;
    test_id?: string;
    test_title?: string;
    coupon_code?: string;
    coupon_id?: string;
    coupon_discount_type?: string;
    coupon_discount_value?: string;
    base_amount_paise?: string;
    discount_amount_paise?: string;
    final_amount_paise?: string;
    [key: string]: string | undefined;
  };
};

function getRazorpayCredentials() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  return { keyId, keySecret };
}

function getAuthHeader() {
  const { keyId, keySecret } = getRazorpayCredentials();
  const encoded = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  return `Basic ${encoded}`;
}

async function parseRazorpayResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | {
        error?: {
          description?: string;
        };
      }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error?.description || "Razorpay request failed");
  }

  return payload;
}

export function getRazorpayKeyId() {
  return getRazorpayCredentials().keyId;
}

function getRazorpayWebhookSecret() {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("Razorpay webhook secret is not configured");
  }

  return webhookSecret;
}

export async function createRazorpayOrder(input: {
  amountPaise: number;
  currency: string;
  receipt: string;
  notes: Record<string, string | number | boolean | null | undefined>;
}) {
  const notes = Object.fromEntries(
    Object.entries(input.notes).flatMap(([key, value]) =>
      value === undefined || value === null ? [] : [[key, String(value)]],
    ),
  );

  const response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: input.currency,
      receipt: input.receipt,
      notes,
    }),
    cache: "no-store",
  });

  const payload = (await parseRazorpayResponse(response)) as RazorpayOrder | null;

  if (!payload?.id) {
    throw new Error("Razorpay order was not created");
  }

  return payload;
}

export async function getRazorpayOrder(orderId: string) {
  const response = await fetch(`${RAZORPAY_API_BASE}/orders/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const payload = (await parseRazorpayResponse(response)) as RazorpayOrder | null;

  if (!payload?.id) {
    throw new Error("Razorpay order was not found");
  }

  return payload;
}

export async function getRazorpayPayment(paymentId: string) {
  const response = await fetch(`${RAZORPAY_API_BASE}/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const payload = (await parseRazorpayResponse(response)) as RazorpayPaymentEntity | null;

  if (!payload?.id) {
    throw new Error("Razorpay payment was not found");
  }

  return payload;
}

export function verifyRazorpaySignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const { keySecret } = getRazorpayCredentials();

  const expectedSignature = createHmac("sha256", keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");

  const providedBuffer = Buffer.from(input.signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function verifyRazorpayWebhookSignature(input: {
  body: string;
  signature: string;
}) {
  const webhookSecret = getRazorpayWebhookSecret();

  const expectedSignature = createHmac("sha256", webhookSecret)
    .update(input.body)
    .digest("hex");

  const providedBuffer = Buffer.from(input.signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}
