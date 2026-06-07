import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WaitlistPanel } from "./waitlist-panel";

const PRICE = { amount: "55000", currency: "XAF" };

function emailInput(): HTMLInputElement {
  const input = document.querySelector('input[type="email"]');
  if (!input) throw new Error("email input not found");
  return input as HTMLInputElement;
}

function submitButton(): HTMLButtonElement {
  const button = document.querySelector('button[type="submit"]');
  if (!button) throw new Error("submit button not found");
  return button as HTMLButtonElement;
}

describe("WaitlistPanel", () => {
  it("keeps submit disabled until dates are picked when travel intent is collected", () => {
    render(
      <WaitlistPanel
        itemId="prop-1"
        kind="property"
        title="Hotel Limbola"
        price={PRICE}
        priceLabel="par nuit"
        collectTravelDates
      />,
    );
    fireEvent.change(emailInput(), { target: { value: "a@b.cm" } });
    expect(submitButton().disabled).toBe(true);
  });

  it("renders a calendar and a guest stepper when travel intent is collected", () => {
    render(
      <WaitlistPanel
        itemId="prop-1"
        kind="property"
        title="Hotel Limbola"
        price={PRICE}
        priceLabel="par nuit"
        collectTravelDates
      />,
    );
    expect(screen.queryByTestId("waitlist-calendar")).toBeTruthy();
    expect(screen.getByTestId("waitlist-guests")).toHaveTextContent("1");
  });

  it("submits with email alone for experiences (no travel fields)", () => {
    render(
      <WaitlistPanel
        itemId="exp-1"
        kind="experience"
        title="Kribi tour"
        price={PRICE}
        priceLabel="par personne"
      />,
    );
    expect(screen.queryByTestId("waitlist-calendar")).toBeNull();
    fireEvent.change(emailInput(), { target: { value: "a@b.cm" } });
    expect(submitButton().disabled).toBe(false);
  });
});
