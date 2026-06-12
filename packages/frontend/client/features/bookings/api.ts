import { apiClient } from "@/shared/api/client";
import { env } from "@/shared/lib/env";
import type { BookingPublic, InitiatePaymentOut } from "./types";

export interface CreateBookingPayload {
  property_id: string;
  room_type_id?: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  currency: string;
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

export async function completePaymentAction(
  payment: InitiatePaymentOut,
): Promise<"done" | "redirected"> {
  const { client_action: clientAction } = payment;

  if (clientAction.kind === "auto_capture") {
    await confirmNoopPayment(payment.provider_intent_id);
    return "done";
  }

  if (
    clientAction.kind === "redirect" &&
    typeof clientAction.url === "string" &&
    clientAction.url.length > 0
  ) {
    window.location.assign(clientAction.url);
    return "redirected";
  }

  throw new Error("Unsupported payment action");
}

export async function initiateConfiguredPayment(
  bookingId: string,
): Promise<InitiatePaymentOut> {
  return initiatePayment(bookingId, env.paymentProvider);
}

export async function listMyBookings(): Promise<BookingPublic[]> {
  const res = await apiClient.get<BookingPublic[]>("/bookings/me");
  return res.data;
}
