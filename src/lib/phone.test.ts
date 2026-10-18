import { describe, it, expect } from 'vitest';
import { normalizePhoneE164, formatPhoneReadable } from './phone';

describe('Phone Normalization & Formatting (libphonenumber-js)', () => {
  it('normalizes standard 10-digit Indian numbers to E.164', () => {
    expect(normalizePhoneE164('9876543210')).toBe('+919876543210');
  });

  it('normalizes Indian numbers with leading 0 to E.164', () => {
    expect(normalizePhoneE164('09876543210')).toBe('+919876543210');
  });

  it('normalizes already formatted +91 numbers', () => {
    expect(normalizePhoneE164('+91 98765 43210')).toBe('+919876543210');
    expect(normalizePhoneE164('+91-9876543210')).toBe('+919876543210');
  });

  it('returns null on invalid numbers', () => {
    expect(normalizePhoneE164('')).toBeNull();
    expect(normalizePhoneE164('12345')).toBeNull();
    expect(normalizePhoneE164('abcd')).toBeNull();
  });

  it('formats readable international numbers', () => {
    expect(formatPhoneReadable('+919876543210')).toBe('+91 98765 43210');
    expect(formatPhoneReadable(null)).toBe('Unknown');
  });
});
