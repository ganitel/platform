import { beforeEach, describe, expect, it, vi } from "vitest";

const { confirmNoopPaymentMock } = vi.hoisted(() => ({
  confirmNoopPaymentMock: vi.fn(),
}));

vi.mock("@/features/bookings/api", () => ({
  confirmNoopPayment: confirmNoopPaymentMock,
}));

import { handlePaymentClientAction } from "./payment-flow";
import type { InitiatePaymentOut } from "./types";

function payment(overrides: Partial<InitiatePaymentOut>): InitiatePaymentOut {
  return {
    payment_id: "payment-1",
    provider: "noop",
    provider_intent_id: "intent-1",
    client_action: { kind: "auto_capture" },
    ...overrides,
  };
}

describe("handlePaymentClientAction", () => {
  beforeEach(() => {
    confirmNoopPaymentMock.mockReset();
  });

  it("confirms noop auto-capture payments through the dev webhook", async () => {
    const result = await handlePaymentClientAction(payment({}));

    expect(result).toBe("completed");
    expect(confirmNoopPaymentMock).toHaveBeenCalledWith("intent-1");
  });

  it("redirects real payment provider intents instead of auto-confirming them", async () => {
    const redirect = vi.fn();
    const result = await handlePaymentClientAction(
      payment({
        provider: "tranzak",
        provider_intent_id: "tranzak-intent",
        client_action: {
          kind: "redirect",
          url: "https://pay.example/checkout",
        },
      }),
      redirect,
    );

    expect(result).toBe("redirected");
    expect(redirect).toHaveBeenCalledWith("https://pay.example/checkout");
    expect(confirmNoopPaymentMock).not.toHaveBeenCalled();
  });

  it("fails closed when a redirect action has no usable URL", async () => {
    await expect(
      handlePaymentClientAction(
        payment({
          provider: "tranzak",
          client_action: { kind: "redirect", url: null },
        }),
      ),
    ).rejects.toThrow("redirect URL");
    expect(confirmNoopPaymentMock).not.toHaveBeenCalled();
  });
});
