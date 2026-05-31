import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  it("renders title in an h1", () => {
    render(<PageHeader title="Hello" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Hello",
    );
  });

  it("renders eyebrow above title when provided", () => {
    render(<PageHeader eyebrow="Section" title="Hello" />);
    expect(screen.getByText("Section")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<PageHeader title="Hello" description="A line of context" />);
    expect(screen.getByText("A line of context")).toBeInTheDocument();
  });

  it("renders actions slot", () => {
    render(<PageHeader title="Hello" actions={<button>Go</button>} />);
    expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument();
  });

  it("renders emphasis as italic inside the title", () => {
    render(<PageHeader title="Where the volcano" emphasis="meets" />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Where the volcano meets");
    const em = heading.querySelector("em");
    expect(em).toHaveTextContent("meets");
  });
});
