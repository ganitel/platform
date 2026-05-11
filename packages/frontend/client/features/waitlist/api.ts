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
  notes?: string;
}

export async function joinWaitlist(payload: WaitlistPayload): Promise<void> {
  const res = await fetch(`${env.apiBaseUrl}/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok && res.status !== 409) {
    throw new Error("waitlist_error");
  }
}
