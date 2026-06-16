import { confirmNoopPayment } from "@/features/bookings/api";
import type { InitiatePaymentOut } from "@/features/bookings/types";
import { env } from "@/shared/lib/env";

export const defaultPaymentProvider = env.paymentProvider;

type Redirect = (url: string) => void;

export async function handlePaymentClientAction(
  payment: InitiatePaymentOut,
  redirect: Redirect = (url) => window.location.assign(url),
): Promise<"completed" | "redirected"> {
  const kind = payment.client_action.kind;
  if (payment.provider === "noop" && kind === "auto_capture") {
    await confirmNoopPayment(payment.provider_intent_id);
    return "completed";
  }

  if (kind === "redirect") {
    const url = payment.client_action.url;
    if (typeof url !== "string" || url.length === 0) {
      throw new Error("Payment provider did not return a redirect URL");
    }
    redirect(url);
    return "redirected";
  }

  throw new Error(`Unsupported payment action: ${String(kind)}`);
}
