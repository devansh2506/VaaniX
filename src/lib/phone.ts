import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

/**
 * Normalizes phone numbers to standard E.164 format.
 * Default country is 'IN' (India).
 * Returns null if the phone number is invalid.
 */
export function normalizePhoneE164(phone: string, defaultCountry: CountryCode = 'IN'): string | null {
  if (!phone || typeof phone !== 'string') return null;

  const trimmed = phone.trim();
  if (!trimmed) return null;

  try {
    const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
    if (parsed && parsed.isValid()) {
      return parsed.format('E.164');
    }

    // Direct fallback for Indian 10-digit mobile numbers starting with 6-9
    const cleanDigits = trimmed.replace(/\D/g, '');
    if (cleanDigits.length === 10 && /^[6-9]/.test(cleanDigits)) {
      return `+91${cleanDigits}`;
    }
    if (cleanDigits.length === 11 && cleanDigits.startsWith('0') && /^[6-9]/.test(cleanDigits.slice(1))) {
      return `+91${cleanDigits.slice(1)}`;
    }
    if (cleanDigits.length === 12 && cleanDigits.startsWith('91') && /^[6-9]/.test(cleanDigits.slice(2))) {
      return `+${cleanDigits}`;
    }
  } catch {
    // Return null on parsing failure
  }

  return null;
}

/**
 * Formats an E.164 phone number into human-readable format.
 * e.g. +919876543210 -> +91 98765 43210
 */
export function formatPhoneReadable(phoneE164?: string | null): string {
  if (!phoneE164) return 'Unknown';
  try {
    const parsed = parsePhoneNumberFromString(phoneE164);
    if (parsed) {
      return parsed.formatInternational();
    }
  } catch {
    // Fall back to original
  }
  return phoneE164;
}
