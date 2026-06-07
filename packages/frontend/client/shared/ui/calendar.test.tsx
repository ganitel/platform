import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Calendar } from "./calendar";

describe("Calendar", () => {
  it("lays out weekday headers and week rows horizontally", () => {
    const { container } = render(<Calendar mode="range" />);
    const weekdaysRow = container.querySelector("thead tr");
    expect(weekdaysRow?.className).toContain("flex");
    const weekRow = container.querySelector("tbody tr");
    expect(weekRow?.className).toContain("flex");
  });

  it("renders day cells as sized buttons", () => {
    const { container } = render(<Calendar mode="range" />);
    const dayButton = container.querySelector("tbody td button");
    expect(dayButton).toBeTruthy();
    expect(dayButton?.className).toContain("h-9");
  });

  it("renders month navigation buttons", () => {
    const { container } = render(<Calendar mode="range" />);
    const previousButton = container.querySelector(
      "button[class*='absolute'][class*='left-1']",
    );
    const nextButton = container.querySelector(
      "button[class*='absolute'][class*='right-1']",
    );
    expect(previousButton).toBeTruthy();
    expect(nextButton).toBeTruthy();
  });
});
