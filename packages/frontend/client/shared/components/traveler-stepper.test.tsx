import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TravelerStepper } from "./traveler-stepper";

describe("TravelerStepper", () => {
  it("increments via the + button and calls onChange", async () => {
    const onChange = vi.fn();
    render(
      <TravelerStepper
        label="Adults"
        decrementLabel="Decrease adults"
        incrementLabel="Increase adults"
        value={1}
        min={1}
        max={4}
        onChange={onChange}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Increase adults" }),
    );
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("decrements via the – button and calls onChange", async () => {
    const onChange = vi.fn();
    render(
      <TravelerStepper
        label="Adults"
        decrementLabel="Decrease adults"
        incrementLabel="Increase adults"
        value={2}
        min={1}
        max={4}
        onChange={onChange}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Decrease adults" }),
    );
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("clamps at min (decrement button disabled)", () => {
    render(
      <TravelerStepper
        label="Adults"
        decrementLabel="Decrease adults"
        incrementLabel="Increase adults"
        value={1}
        min={1}
        max={4}
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Decrease adults" }),
    ).toBeDisabled();
  });

  it("clamps at max (increment button disabled)", () => {
    render(
      <TravelerStepper
        label="Adults"
        decrementLabel="Decrease adults"
        incrementLabel="Increase adults"
        value={4}
        min={1}
        max={4}
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Increase adults" }),
    ).toBeDisabled();
  });
});
