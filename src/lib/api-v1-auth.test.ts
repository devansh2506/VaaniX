import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticateApiKey } from './api-v1-auth';

const mockAdmin = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockAdmin,
}));

describe('API v1 Authentication Helper (authenticateApiKey)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects requests without Authorization header', async () => {
    const req = new Request('http://localhost:3000/api/v1/analyze');
    const result = await authenticateApiKey(req);

    expect(result.authenticated).toBe(false);
    if (!result.authenticated) {
      expect(result.status).toBe(401);
      expect(result.error.code).toBe('UNAUTHORIZED');
    }
  });

  it('rejects non-Bearer Authorization headers', async () => {
    const req = new Request('http://localhost:3000/api/v1/analyze', {
      headers: { Authorization: 'Basic dXNlcjpwYXNz' },
    });
    const result = await authenticateApiKey(req);

    expect(result.authenticated).toBe(false);
    if (!result.authenticated) {
      expect(result.status).toBe(401);
      expect(result.error.code).toBe('UNAUTHORIZED');
    }
  });

  it('rejects invalid or unknown API keys', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') });

    mockAdmin.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    const req = new Request('http://localhost:3000/api/v1/analyze', {
      headers: { Authorization: 'Bearer vx_live_nonexistentkey12345' },
    });
    const result = await authenticateApiKey(req);

    expect(result.authenticated).toBe(false);
    if (!result.authenticated) {
      expect(result.status).toBe(401);
      expect(result.error.code).toBe('UNAUTHORIZED');
    }
  });

  it('rejects revoked API keys', async () => {
    mockAdmin.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'k1',
          owner_user_id: 'u1',
          name: 'Revoked Key',
          scopes: ['checks:create'],
          revoked_at: '2026-10-18T10:00:00Z',
          request_count: 5,
        },
        error: null,
      }),
    });

    const req = new Request('http://localhost:3000/api/v1/analyze', {
      headers: { Authorization: 'Bearer vx_live_revokedkey12345' },
    });
    const result = await authenticateApiKey(req);

    expect(result.authenticated).toBe(false);
    if (!result.authenticated) {
      expect(result.status).toBe(401);
      expect(result.error.code).toBe('KEY_REVOKED');
    }
  });

  it('rejects keys lacking the required scope', async () => {
    mockAdmin.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'k1',
          owner_user_id: 'u1',
          name: 'Read Only Key',
          scopes: ['checks:read'],
          revoked_at: null,
          request_count: 5,
        },
        error: null,
      }),
    });

    const req = new Request('http://localhost:3000/api/v1/analyze', {
      headers: { Authorization: 'Bearer vx_live_readonlykey12345' },
    });
    const result = await authenticateApiKey(req, 'checks:create');

    expect(result.authenticated).toBe(false);
    if (!result.authenticated) {
      expect(result.status).toBe(403);
      expect(result.error.code).toBe('FORBIDDEN');
    }
  });

  it('authenticates valid active key with appropriate scope', async () => {
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEqUpdate = vi.fn().mockResolvedValue({ error: null });

    mockAdmin.from.mockImplementation((table: string) => {
      if (table === 'api_clients') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'k1',
              owner_user_id: 'user_123',
              name: 'Production Key',
              scopes: ['checks:create', 'checks:read'],
              revoked_at: null,
              request_count: 10,
            },
            error: null,
          }),
          update: mockUpdate.mockReturnValue({ eq: mockEqUpdate }),
        };
      }
      return {};
    });

    const rawKey = 'vx_live_validkey1234567890';
    const req = new Request('http://localhost:3000/api/v1/analyze', {
      headers: { Authorization: `Bearer ${rawKey}` },
    });
    const result = await authenticateApiKey(req, 'checks:create');

    expect(result.authenticated).toBe(true);
    if (result.authenticated) {
      expect(result.client.id).toBe('k1');
      expect(result.client.owner_user_id).toBe('user_123');
      expect(result.client.name).toBe('Production Key');
    }
  });
});
