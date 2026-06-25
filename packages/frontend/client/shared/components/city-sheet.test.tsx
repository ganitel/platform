import { useState } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CitySheet } from "./city-sheet";

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <MemoryRouter>
      <button type="button" onClick={() => setOpen(true)}>
        trigger
      </button>
      <CitySheet open={open} onOpenChange={setOpen} />
    </MemoryRouter>
  );
}

describe("CitySheet", () => {
  it("opens when the controlling parent flips `open` to true", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(
      screen.queryByText("Quelle ville aimeriez-vous explorer ?"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByText("trigger"));

    expect(
      await screen.findByText("Quelle ville aimeriez-vous explorer ?"),
    ).toBeInTheDocument();
  });
});
