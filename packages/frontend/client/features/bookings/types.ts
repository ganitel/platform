import type { Money } from "@/features/properties/types";

export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled_by_guest"
  | "cancelled_by_host"
  | "cancelled_expired"
  | "completed"
  | "disputed";

export interface BookingPublic {
  id: string;
  property_id: string;
  guest_id: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  guest_count: number;
  subtotal: Money;
  total: Money;
  status: BookingStatus;
  hold_expires_at: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export interface InitiatePaymentOut {
  payment_id: string;
  provider: string;
  provider_intent_id: string;
  client_action: Record<string, unknown>;
}
