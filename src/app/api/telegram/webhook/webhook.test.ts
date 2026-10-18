import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

const { mockAdmin } = vi.hoisted(() => ({
  mockAdmin: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockAdmin,
}));

vi.mock('@/lib/telegram/bot', async () => {
  const actual = await vi.importActual<typeof import('@/lib/telegram/bot')>('@/lib/telegram/bot');
  return {
    ...actual,
    sendTelegramMessage: vi.fn().mockResolvedValue({ ok: true, messageId: 101 }),
  };
});

describe('Telegram Webhook Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TELEGRAM_WEBHOOK_SECRET = 'test_secret_123';
  });

  it('rejects request with missing or incorrect secret token header', async () => {
    const req = new Request('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': 'wrong_secret',
      },
      body: JSON.stringify({ message: { text: 'hello' } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain('Unauthorized');
  });

  it('handles /start u_<token> owner linking successfully', async () => {
    mockAdmin.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { display_name: 'Test Owner' },
              error: null,
            }),
          }),
        }),
      }),
    });

    const req = new Request('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': 'test_secret_123',
      },
      body: JSON.stringify({
        message: {
          chat: { id: 123456 },
          text: '/start u_valid_token_abc',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.linked).toBe('owner');
  });

  it('handles /start m_<token> member linking successfully', async () => {
    mockAdmin.from.mockImplementation((table: string) => {
      if (table === 'family_members') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { name: 'Rahul', relationship: 'son', user_id: 'user-1' },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { display_name: 'Vikram Sharma' },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const req = new Request('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': 'test_secret_123',
      },
      body: JSON.stringify({
        message: {
          chat: { id: 789101 },
          text: '/start m_member_token_xyz',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.linked).toBe('member');
  });

  it('handles callback verify_no:alertId (impersonation denied by member)', async () => {
    mockAdmin.from.mockImplementation((table: string) => {
      if (table === 'alerts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'alert-1',
                  check_id: 'check-1',
                  user_id: 'user-1',
                  impersonated_member_id: 'member-1',
                },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'checks') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { caller_e164: '+919876543210', scam_type: 'authority' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'family_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { name: 'Rahul' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { telegram_chat_id: 111222 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'radar_reports') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    });

    const req = new Request('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': 'test_secret_123',
      },
      body: JSON.stringify({
        callback_query: {
          id: 'cb-1',
          data: 'verify_no:alert-1',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.action).toBe('confirmed_scam');
  });

  it('handles callback dismiss_genuine:alertId (owner marks genuine)', async () => {
    mockAdmin.from.mockImplementation((table: string) => {
      if (table === 'alerts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'alert-2', check_id: 'check-2', user_id: 'user-2' },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'feedback') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === 'radar_reports') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {};
    });

    const req = new Request('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': 'test_secret_123',
      },
      body: JSON.stringify({
        callback_query: {
          id: 'cb-2',
          data: 'dismiss_genuine:alert-2',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.action).toBe('dismissed_genuine');
  });
});
