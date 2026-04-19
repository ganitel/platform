import { describe, it, expect } from 'vitest';
import { useProfile, useUpdateProfile, useUploadAvatar, useMyBookings, useChangePassword } from './useProfile';

describe('useProfile hooks', () => {
  describe('Hook exports', () => {
    it('should export all profile hooks', () => {
      expect(typeof useProfile).toBe('function');
      expect(typeof useUpdateProfile).toBe('function');
      expect(typeof useUploadAvatar).toBe('function');
      expect(typeof useMyBookings).toBe('function');
      expect(typeof useChangePassword).toBe('function');
    });
  });
});