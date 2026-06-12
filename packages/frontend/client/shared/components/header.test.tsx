import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

// Header uses useDeferredSession → calls Supabase, which requires env vars
// that aren't set in CI. Mock the hook so the test stays env-free.
vi.mock("@/features/auth/hooks/use-deferred-session", () => ({
  useDeferredSession: () => ({ session: null, isPending: false }),
}));

// Prelaunch mode otherwise follows whatever .env the machine has; pin it per
// scenario so the suite behaves the same locally and in CI.
const prelaunchMock = vi.hoisted(() => ({ value: false }));
vi.mock("@/shared/hooks/use-prelaunch", () => ({
  usePrelaunch: () => prelaunchMock.value,
}));

import { Header } from "./header";

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );
}

describe("Header (post-launch)", () => {
  beforeEach(() => {
    prelaunchMock.value = false;
  });

  it("renders a hamburger trigger labelled 'Open menu'", () => {
    renderHeader();
    expect(
      screen.getByRole("button", { name: /open menu|ouvrir le menu/i }),
    ).toBeInTheDocument();
  });

  it("opens the drawer when hamburger is clicked", async () => {
    renderHeader();
    const trigger = screen.getByRole("button", {
      name: /open menu|ouvrir le menu/i,
    });
    await userEvent.click(trigger);
    // Drawer shows the close button when open
    expect(
      await screen.findByRole("button", { name: /close menu|fermer le menu/i }),
    ).toBeInTheDocument();
  });

  it("links the brand wordmark to /", () => {
    renderHeader();
    const brand = screen.getAllByRole("link", { name: /ganitel/i })[0];
    expect(brand).toHaveAttribute("href", "/");
  });
});

describe("Header (prelaunch)", () => {
  beforeEach(() => {
    prelaunchMock.value = true;
  });

  it("renders no hamburger — bottom nav covers all destinations", () => {
    renderHeader();
    expect(
      screen.queryByRole("button", { name: /open menu|ouvrir le menu/i }),
    ).not.toBeInTheDocument();
  });

  it("links the brand wordmark to /", () => {
    renderHeader();
    const brand = screen.getAllByRole("link", { name: /ganitel/i })[0];
    expect(brand).toHaveAttribute("href", "/");
  });
});
