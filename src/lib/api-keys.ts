import crypto from 'crypto';

export type ApiScope = 'checks:create' | 'checks:read' | 'evidence' | 'complaint' | 'radar';

export const ALL_SCOPES: ApiScope[] = [
  'checks:create',
  'checks:read',
  'evidence',
  'complaint',
  'radar',
];

export const DEFAULT_SCOPES: ApiScope[] = ['checks:create', 'checks:read'];

export interface GeneratedKey {
  plaintext: string;
  keyPrefix: string;
  keyHash: string;
}

/**
 * Generate a cryptographically secure API key.
 * Format: vx_live_<64 hex chars>
 * Prefix: vx_live_<first 8 chars of hex>...
 */
export function generateApiKey(): GeneratedKey {
  const randomHex = crypto.randomBytes(32).toString('hex');
  const plaintext = `vx_live_${randomHex}`;
  const keyPrefix = `vx_live_${randomHex.slice(0, 8)}...`;
  const keyHash = hashApiKey(plaintext);

  return {
    plaintext,
    keyPrefix,
    keyHash,
  };
}

/**
 * Compute SHA-256 hash of plaintext API key for secure DB storage & lookup.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key.trim()).digest('hex');
}

/**
 * Verify whether granted scopes satisfy required scope.
 */
export function hasScope(grantedScopes: string[] | null | undefined, requiredScope: ApiScope): boolean {
  if (!grantedScopes || !Array.isArray(grantedScopes)) return false;
  return grantedScopes.includes(requiredScope) || grantedScopes.includes('*');
}
