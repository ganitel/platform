import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiPostMock } = vi.hoisted(() => ({
  apiPostMock: vi.fn(),
}));

vi.mock("@/shared/api/client", () => ({
  apiClient: {
    post: apiPostMock,
  },
}));

vi.mock("@/shared/lib/env", () => ({
  env: {
    paymentProvider: "stripe",
  },
}));

import {
  completePaymentAction,
  initiateConfiguredPayment,
} from "@/features/bookings/api";
import type { InitiatePaymentOut } from "@/features/bookings/types";

function paymentWithAction(
  clientAction: InitiatePaymentOut["client_action"],
): InitiatePaymentOut {
  return {
    payment_id: "payment-1",
    provider: "noop",
    provider_intent_id: "intent-1",
    client_action: clientAction,
  };
}

describe("bookings payment api", () => {
  beforeEach(() => {
    apiPostMock.mockReset();
  });

  it("initiates payments with the configured provider", async () => {
    apiPostMock.mockResolvedValueOnce({
      data: paymentWithAction({ kind: "redirect", url: "https://pay.test" }),
    });

    await initiateConfiguredPayment("booking-1");

    expect(apiPostMock).toHaveBeenCalledWith(
      "/bookings/booking-1/initiate-payment",
      { provider: "stripe" },
    );
  });

  it("auto-captures noop payment actions", async () => {
    apiPostMock.mockResolvedValueOnce({ data: { received: true } });

    await expect(
      completePaymentAction(paymentWithAction({ kind: "auto_capture" })),
    ).resolves.toBe("done");

    expect(apiPostMock).toHaveBeenCalledWith("/webhooks/noop", {
      intent_id: "intent-1",
      status: "captured",
    });
  });

  it("redirects when the provider returns a redirect action", async () => {
    const navigate = vi.fn();

    await expect(
      completePaymentAction(
        paymentWithAction({ kind: "redirect", url: "https://pay.test" }),
        navigate,
      ),
    ).resolves.toBe("redirected");

    expect(navigate).toHaveBeenCalledWith("https://pay.test");
    expect(apiPostMock).not.toHaveBeenCalled();
  });

  it("rejects unsupported payment actions", async () => {
    await expect(
      completePaymentAction(paymentWithAction({ kind: "unknown" })),
    ).rejects.toThrow("Unsupported payment action");
  });
});
