import { describe, it, expect } from 'vitest';
import { toBackendGuestCount } from './BookingContext';

describe('toBackendGuestCount', () => {
  it('returns 1 when guests are missing', () => {
    expect(toBackendGuestCount(undefined)).toBe(1);
    expect(toBackendGuestCount(null)).toBe(1);
  });

  it('sums adults, children and infants for backend payload', () => {
    expect(
      toBackendGuestCount({
        adults: 2,
        children: 1,
        infants: 1,
      })
    ).toBe(4);
  });

  it('guards against zero or negative totals with minimum 1', () => {
    expect(
      toBackendGuestCount({
        adults: 0,
        children: 0,
        infants: 0,
      })
    ).toBe(1);
  });
});
