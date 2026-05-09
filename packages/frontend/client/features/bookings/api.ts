import { apiClient } from "@/shared/api/client";
import type { BookingPublic, InitiatePaymentOut } from "./types";

export interface CreateBookingPayload {
  property_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
}

export async function createBooking(
  payload: CreateBookingPayload,
): Promise<BookingPublic> {
  const res = await apiClient.post<BookingPublic>("/bookings", payload);
  return res.data;
}

export async function initiatePayment(
  bookingId: string,
  provider: string,
): Promise<InitiatePaymentOut> {
  const res = await apiClient.post<InitiatePaymentOut>(
    `/bookings/${bookingId}/initiate-payment`,
    { provider },
  );
  return res.data;
}

export async function confirmNoopPayment(intentId: string): Promise<void> {
  await apiClient.post("/webhooks/noop", {
    intent_id: intentId,
    status: "captured",
  });
}

export async function listMyBookings(): Promise<BookingPublic[]> {
  const res = await apiClient.get<BookingPublic[]>("/bookings/me");
  return res.data;
}
