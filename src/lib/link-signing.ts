import crypto from 'crypto';

const SIGNING_SECRET = process.env.LINK_SIGNING_SECRET || 'dev-secret-link-signing-key-12345';

/**
 * Generates an HMAC-SHA256 signature for alert redirect links (/r/cyber, /r/bank).
 * Default expiration is 7 days (604800 seconds).
 */
export function signAlertLink(
  alertId: string,
  target: 'cyber' | 'bank',
  expiresInSeconds = 7 * 24 * 3600
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `${alertId}:${target}:${expiresAt}`;
  const signature = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(payload)
    .digest('hex');

  return `${expiresAt}.${signature}`;
}

/**
 * Validates the HMAC signature and expiration timestamp.
 */
export function verifyAlertLink(
  alertId: string,
  target: 'cyber' | 'bank',
  token?: string | null
): boolean {
  if (!token || !token.includes('.')) return false;

  const [expiresAtStr, signature] = token.split('.');
  const expiresAt = parseInt(expiresAtStr, 10);

  if (isNaN(expiresAt) || Math.floor(Date.now() / 1000) > expiresAt) {
    return false; // Expired
  }

  const payload = `${alertId}:${target}:${expiresAt}`;
  const expectedSignature = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
