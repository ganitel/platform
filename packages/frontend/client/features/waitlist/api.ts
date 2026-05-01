import { env } from "@/shared/lib/env";

interface WaitlistPayload {
  email: string;
  name?: string;
  property_id?: string;
  experience_id?: string;
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
