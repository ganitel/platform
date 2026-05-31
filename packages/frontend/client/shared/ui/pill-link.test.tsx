import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { PillLink } from "./pill-link";

describe("PillLink", () => {
  it("renders a link with the destination", () => {
    render(
      <MemoryRouter>
        <PillLink to="/somewhere">Go</PillLink>
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Go" })).toHaveAttribute(
      "href",
      "/somewhere",
    );
  });

  it("renders editorial variant with underline styling", () => {
    render(
      <MemoryRouter>
        <PillLink to="/somewhere" variant="editorial" arrow>
          Read story
        </PillLink>
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: /read story/i });
    expect(link.className).toContain("underline");
  });

  it("renders arrow icon when arrow=true", () => {
    render(
      <MemoryRouter>
        <PillLink to="/x" arrow>
          With arrow
        </PillLink>
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: /with arrow/i });
    expect(link.querySelector("svg")).toBeInTheDocument();
  });
});
