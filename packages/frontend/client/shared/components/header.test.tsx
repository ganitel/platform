import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import { Header } from "./header";

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );
}

describe("Header", () => {
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
      await screen.findByRole("button", { name: /close menu/i }),
    ).toBeInTheDocument();
  });

  it("links the brand wordmark to /", () => {
    renderHeader();
    const brand = screen.getAllByRole("link", { name: /ganitel/i })[0];
    expect(brand).toHaveAttribute("href", "/");
  });
});
