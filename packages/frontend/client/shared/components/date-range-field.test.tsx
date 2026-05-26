import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DateRangeField } from "./date-range-field";

const PROPS = {
  startLabel: "Arrival",
  endLabel: "Departure",
  startPlaceholder: "Pick a date",
  endPlaceholder: "Pick a date",
  todayIso: "2026-05-26",
};

describe("DateRangeField", () => {
  it("calls onStartChange when arrival changes", async () => {
    const onStartChange = vi.fn();
    render(
      <DateRangeField
        {...PROPS}
        startValue=""
        endValue=""
        onStartChange={onStartChange}
        onEndChange={() => {}}
      />,
    );
    const start = screen.getByLabelText("Arrival");
    await userEvent.type(start, "2026-06-01");
    expect(onStartChange).toHaveBeenCalled();
  });

  it("uses today as the start min and start as the end min", () => {
    render(
      <DateRangeField
        {...PROPS}
        startValue="2026-06-01"
        endValue=""
        onStartChange={() => {}}
        onEndChange={() => {}}
      />,
    );
    expect(screen.getByLabelText("Arrival")).toHaveAttribute(
      "min",
      "2026-05-26",
    );
    expect(screen.getByLabelText("Departure")).toHaveAttribute(
      "min",
      "2026-06-01",
    );
  });

  it("falls back to today for end min when no start is set", () => {
    render(
      <DateRangeField
        {...PROPS}
        startValue=""
        endValue=""
        onStartChange={() => {}}
        onEndChange={() => {}}
      />,
    );
    expect(screen.getByLabelText("Departure")).toHaveAttribute(
      "min",
      "2026-05-26",
    );
  });
});
