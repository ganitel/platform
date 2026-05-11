import { env } from "@/shared/lib/env";

interface WaitlistPayload {
  email: string;
  name?: string;
  phone?: string;
  property_id?: string;
  experience_id?: string;
  interest?: "renting" | "experiences" | "both";
  headcount?: number;
  budget_range?: string;
  budget_currency?: "xaf" | "eur" | "usd";
  role?: "traveler" | "host";
  host_city?: string;
  host_inventory?: "1" | "2_5" | "6_10" | "10_plus";
  host_status?: "ready" | "under_construction" | "planning" | "just_exploring";
  notes?: string;
}

export interface WaitlistResult {
  confirmation_email_sent: boolean;
}

export async function joinWaitlist(
  payload: WaitlistPayload,
): Promise<WaitlistResult> {
  const res = await fetch(`${env.apiBaseUrl}/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok && res.status !== 409) {
    throw new Error("waitlist_error");
  }
  if (res.status === 409) {
    return { confirmation_email_sent: false };
  }
  const json = (await res.json().catch(() => null)) as {
    confirmation_email_sent?: boolean;
  } | null;
  return {
    confirmation_email_sent: json?.confirmation_email_sent ?? false,
  };
}
