import { describe, expect, it } from "vitest";

import { buildWaitlistPayload } from "./payload";

const FORM = { email: "guest@example.com", name: "", phone: "" };

describe("buildWaitlistPayload", () => {
  it("sends travel dates as ISO dates with the guest count as adults", () => {
    const payload = buildWaitlistPayload({
      ...FORM,
      kind: "property",
      itemId: "prop-1",
      range: { from: new Date(2026, 6, 10), to: new Date(2026, 6, 14) },
      guests: 3,
    });
    expect(payload).toMatchObject({
      property_id: "prop-1",
      travel_start: "2026-07-10",
      travel_end: "2026-07-14",
      adults: 3,
    });
  });

  it("records the chosen room as room_type_id", () => {
    const payload = buildWaitlistPayload({
      ...FORM,
      kind: "property",
      itemId: "prop-1",
      roomTypeId: "room-9",
      range: { from: new Date(2026, 6, 10), to: new Date(2026, 6, 14) },
      guests: 2,
    });
    expect(payload.room_type_id).toBe("room-9");
  });

  it("omits travel and room fields for experiences", () => {
    const payload = buildWaitlistPayload({
      ...FORM,
      kind: "experience",
      itemId: "exp-1",
    });
    expect(payload).toMatchObject({ experience_id: "exp-1" });
    expect(payload).not.toHaveProperty("property_id");
    expect(payload).not.toHaveProperty("travel_start");
    expect(payload).not.toHaveProperty("room_type_id");
    expect(payload).not.toHaveProperty("adults");
  });

  it("omits empty optional name and phone", () => {
    const payload = buildWaitlistPayload({
      ...FORM,
      kind: "property",
      itemId: "prop-1",
    });
    expect(payload).not.toHaveProperty("name");
    expect(payload).not.toHaveProperty("phone");
  });
});
