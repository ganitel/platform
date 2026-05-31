import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MobileDrawer } from "./mobile-drawer";

describe("MobileDrawer", () => {
  it("renders children when open", () => {
    render(
      <MobileDrawer
        open
        onOpenChange={() => {}}
        title="Menu"
        closeLabel="Close menu"
      >
        <a href="/about">About</a>
      </MobileDrawer>,
    );
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
  });

  it("renders the title", () => {
    render(
      <MobileDrawer
        open
        onOpenChange={() => {}}
        title="Menu"
        closeLabel="Close menu"
      >
        <a href="/about">About</a>
      </MobileDrawer>,
    );
    expect(screen.getByText("Menu")).toBeInTheDocument();
  });

  it("uses the provided closeLabel on the close button", async () => {
    const onOpenChange = vi.fn();
    render(
      <MobileDrawer
        open
        onOpenChange={onOpenChange}
        title="Menu"
        closeLabel="Fermer le menu"
      >
        <a href="/about">About</a>
      </MobileDrawer>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Fermer le menu" }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not render content when closed", () => {
    render(
      <MobileDrawer
        open={false}
        onOpenChange={() => {}}
        title="Menu"
        closeLabel="Close menu"
      >
        <a href="/about">About</a>
      </MobileDrawer>,
    );
    expect(
      screen.queryByRole("link", { name: "About" }),
    ).not.toBeInTheDocument();
  });
});
