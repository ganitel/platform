import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { FormField } from "./form-field";

describe("FormField", () => {
  it("renders label associated with input by htmlFor", () => {
    render(
      <FormField label="Email" htmlFor="email">
        <input id="email" />
      </FormField>,
    );
    const label = screen.getByText("Email");
    expect(label).toHaveAttribute("for", "email");
  });

  it("renders a visual required indicator hidden from screen readers", () => {
    const { container } = render(
      <FormField label="Name" htmlFor="name" required>
        <input id="name" aria-required="true" required />
      </FormField>,
    );
    const star = container.querySelector("[aria-hidden='true']");
    expect(star).not.toBeNull();
    expect(star?.textContent).toBe("*");
  });

  it("renders error text when provided", () => {
    render(
      <FormField label="Email" htmlFor="email" error="Invalid">
        <input id="email" />
      </FormField>,
    );
    expect(screen.getByText("Invalid")).toBeInTheDocument();
  });

  it("renders hint when no error is present", () => {
    render(
      <FormField label="Phone" htmlFor="phone" hint="Mobile only">
        <input id="phone" />
      </FormField>,
    );
    expect(screen.getByText("Mobile only")).toBeInTheDocument();
  });

  it("suppresses hint when an error is also passed", () => {
    render(
      <FormField
        label="Phone"
        htmlFor="phone"
        hint="Mobile only"
        error="Invalid"
      >
        <input id="phone" />
      </FormField>,
    );
    expect(screen.queryByText("Mobile only")).not.toBeInTheDocument();
    expect(screen.getByText("Invalid")).toBeInTheDocument();
  });
});
