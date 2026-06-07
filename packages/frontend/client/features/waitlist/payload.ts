import type { DateRange } from "react-day-picker";

import type { WaitlistPayload } from "@/features/waitlist/api";

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface BuildWaitlistPayloadArgs {
  email: string;
  name: string;
  phone: string;
  kind: "property" | "experience";
  itemId: string;
  range?: DateRange;
  guests?: number;
  roomTypeId?: string;
}

export function buildWaitlistPayload({
  email,
  name,
  phone,
  kind,
  itemId,
  range,
  guests,
  roomTypeId,
}: BuildWaitlistPayloadArgs): WaitlistPayload {
  const payload: WaitlistPayload = { email };
  if (name) payload.name = name;
  if (phone) payload.phone = phone;

  if (kind === "experience") {
    payload.experience_id = itemId;
    return payload;
  }

  payload.property_id = itemId;
  if (range?.from && range?.to) {
    payload.travel_start = toIsoDate(range.from);
    payload.travel_end = toIsoDate(range.to);
  }
  if (guests) payload.adults = guests;
  if (roomTypeId) payload.room_type_id = roomTypeId;
  return payload;
}
