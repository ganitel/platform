import { apiClient } from "@/shared/api/client";

interface WaitlistPayload {
  email: string;
  name?: string;
  phone?: string;
  property_id?: string;
  experience_id?: string;
  interest?: "renting" | "experiences" | "both";
  travel_start?: string;
  travel_end?: string;
  adults?: number;
  children?: number;
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
  const response = await apiClient.post<{ confirmation_email_sent?: boolean }>(
    "/waitlist",
    payload,
  );
  return {
    confirmation_email_sent: response.data?.confirmation_email_sent ?? false,
  };
}
