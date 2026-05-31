import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { UnderlineTabs } from "./underline-tabs";

describe("UnderlineTabs", () => {
  const items = [
    { value: "stays", label: "Stays" },
    { value: "experiences", label: "Experiences" },
  ] as const;

  it("marks active tab via aria-selected", () => {
    render(<UnderlineTabs items={items} value="stays" onChange={() => {}} />);
    expect(screen.getByRole("tab", { name: "Stays" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Experiences" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("calls onChange with the value when clicking another tab", async () => {
    const onChange = vi.fn();
    render(<UnderlineTabs items={items} value="stays" onChange={onChange} />);
    await userEvent.click(screen.getByRole("tab", { name: "Experiences" }));
    expect(onChange).toHaveBeenCalledWith("experiences");
  });

  it("applies ariaLabel to the tablist", () => {
    render(
      <UnderlineTabs
        items={items}
        value="stays"
        onChange={() => {}}
        ariaLabel="Browse mode"
      />,
    );
    expect(screen.getByRole("tablist")).toHaveAttribute(
      "aria-label",
      "Browse mode",
    );
  });
});
