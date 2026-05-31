import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MobileDrawer } from "./mobile-drawer";

describe("MobileDrawer", () => {
  it("renders children when open", () => {
    render(
      <MobileDrawer open onOpenChange={() => {}} title="Menu">
        <a href="/about">About</a>
      </MobileDrawer>,
    );
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
  });

  it("renders the title", () => {
    render(
      <MobileDrawer open onOpenChange={() => {}} title="Menu">
        <a href="/about">About</a>
      </MobileDrawer>,
    );
    expect(screen.getByText("Menu")).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when close button is clicked", async () => {
    const onOpenChange = vi.fn();
    render(
      <MobileDrawer open onOpenChange={onOpenChange} title="Menu">
        <a href="/about">About</a>
      </MobileDrawer>,
    );
    await userEvent.click(screen.getByRole("button", { name: /close menu/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not render content when closed", () => {
    render(
      <MobileDrawer open={false} onOpenChange={() => {}} title="Menu">
        <a href="/about">About</a>
      </MobileDrawer>,
    );
    expect(
      screen.queryByRole("link", { name: "About" }),
    ).not.toBeInTheDocument();
  });
});
