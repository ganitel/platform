import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Statement } from "./statement";

describe("Statement", () => {
  it("renders body text", () => {
    render(<Statement body="A small, vetted network." />);
    expect(screen.getByText("A small, vetted network.")).toBeInTheDocument();
  });

  it("renders eyebrow when provided", () => {
    render(<Statement eyebrow="Promise" body="Body" />);
    expect(screen.getByText("Promise")).toBeInTheDocument();
  });

  it("renders subtext when provided", () => {
    render(<Statement body="Body" sub="No directory. No filler." />);
    expect(screen.getByText("No directory. No filler.")).toBeInTheDocument();
  });

  it("renders italic accent inside body when emphasis nodes are used", () => {
    render(
      <Statement
        body={
          <>
            A network of <em>hosts</em>, <em>guides</em> and drivers
          </>
        }
      />,
    );
    expect(screen.getByText("hosts")).toBeInTheDocument();
    expect(screen.getByText("guides")).toBeInTheDocument();
  });
});
