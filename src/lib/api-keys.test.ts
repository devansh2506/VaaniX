import { describe, it, expect } from 'vitest';
import {
  generateApiKey,
  hashApiKey,
  hasScope,
  ALL_SCOPES,
  DEFAULT_SCOPES,
} from './api-keys';

describe('API Key Utilities', () => {
  it('generates a cryptographically secure key with vx_live_ prefix and valid hash', () => {
    const keyData = generateApiKey();

    expect(keyData.plaintext.startsWith('vx_live_')).toBe(true);
    // vx_live_ (8 chars) + 64 hex chars = 72 chars
    expect(keyData.plaintext.length).toBe(72);
    expect(keyData.keyPrefix.startsWith('vx_live_')).toBe(true);
    expect(keyData.keyPrefix.endsWith('...')).toBe(true);

    // Verify hash matches
    const expectedHash = hashApiKey(keyData.plaintext);
    expect(keyData.keyHash).toBe(expectedHash);
    expect(keyData.keyHash.length).toBe(64); // SHA-256 hex is 64 chars
  });

  it('generates unique keys each time', () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();

    expect(key1.plaintext).not.toBe(key2.plaintext);
    expect(key1.keyHash).not.toBe(key2.keyHash);
  });

  it('hashes consistently', () => {
    const plaintext = 'vx_live_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const hash1 = hashApiKey(plaintext);
    const hash2 = hashApiKey(plaintext);
    expect(hash1).toBe(hash2);
  });

  it('verifies scopes accurately', () => {
    const scopes = ['checks:create', 'checks:read'];

    expect(hasScope(scopes, 'checks:create')).toBe(true);
    expect(hasScope(scopes, 'checks:read')).toBe(true);
    expect(hasScope(scopes, 'evidence')).toBe(false);
    expect(hasScope(scopes, 'complaint')).toBe(false);
    expect(hasScope(scopes, 'radar')).toBe(false);

    // Wildcard support
    expect(hasScope(['*'], 'evidence')).toBe(true);
    expect(hasScope(['*'], 'radar')).toBe(true);

    // Empty/null cases
    expect(hasScope([], 'checks:create')).toBe(false);
    expect(hasScope(null, 'checks:create')).toBe(false);
  });

  it('provides all expected scopes in ALL_SCOPES', () => {
    expect(ALL_SCOPES).toEqual(['checks:create', 'checks:read', 'evidence', 'complaint', 'radar']);
    expect(DEFAULT_SCOPES).toEqual(['checks:create', 'checks:read']);
  });
});
