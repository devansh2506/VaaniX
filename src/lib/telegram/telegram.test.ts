import { describe, it, expect } from 'vitest';
import { signAlertLink, verifyAlertLink } from '@/lib/link-signing';
import {
  buildOwnerAlertPayload,
  buildMemberAlertPayload,
  getScamAdvice,
} from '@/lib/telegram/bot';

describe('Link Signing (HMAC-SHA256 with 7-day expiration)', () => {
  const alertId = '123e4567-e89b-12d3-a456-426614174000';

  it('generates valid token and verifies successfully', () => {
    const token = signAlertLink(alertId, 'cyber', 3600);
    expect(token).toBeDefined();
    expect(token).toContain('.');

    const isValid = verifyAlertLink(alertId, 'cyber', token);
    expect(isValid).toBe(true);
  });

  it('rejects verification if target is different', () => {
    const token = signAlertLink(alertId, 'cyber', 3600);
    const isValid = verifyAlertLink(alertId, 'bank', token);
    expect(isValid).toBe(false);
  });

  it('rejects verification if alertId is different', () => {
    const token = signAlertLink(alertId, 'cyber', 3600);
    const isValid = verifyAlertLink('different-alert-id', 'cyber', token);
    expect(isValid).toBe(false);
  });

  it('rejects expired tokens', () => {
    // Generate a token that expired 10 seconds ago
    const expiredToken = signAlertLink(alertId, 'cyber', -10);
    const isValid = verifyAlertLink(alertId, 'cyber', expiredToken);
    expect(isValid).toBe(false);
  });

  it('rejects malformed or tampered signatures', () => {
    expect(verifyAlertLink(alertId, 'cyber', 'invalid-token')).toBe(false);
    expect(verifyAlertLink(alertId, 'cyber', null)).toBe(false);

    const validToken = signAlertLink(alertId, 'cyber', 3600);
    const [expires, sig] = validToken.split('.');
    const tampered = `${expires}.${sig.slice(0, -2)}00`;
    expect(verifyAlertLink(alertId, 'cyber', tampered)).toBe(false);
  });
});

describe('Telegram Payload Builder', () => {
  const alertId = 'alert-uuid-999';

  it('builds owner alert payload with all required action buttons', () => {
    const payload = buildOwnerAlertPayload(
      alertId,
      '+919876543210',
      85,
      'Rahul (Son)',
      ['police', 'arrest', 'money'],
      'authority'
    );

    expect(payload.text).toContain('AI-cloned voice detected');
    expect(payload.text).toContain('+919876543210');
    expect(payload.text).toContain('85/100');
    expect(payload.text).toContain('Rahul (Son)');
    expect(payload.text).toContain('police, arrest, money');

    // Verify inline keyboard contains all required buttons
    const keyboard = payload.replyMarkup.inline_keyboard;
    expect(keyboard.length).toBe(4);
    expect(keyboard[0][0].text).toContain('Report to Cyber Crime');
    expect((keyboard[0][0] as { url: string }).url).toContain(`/r/cyber/${alertId}`);
    expect(keyboard[1][0].text).toContain('Report to Bank');
    expect((keyboard[1][0] as { url: string }).url).toContain(`/r/bank/${alertId}`);
    expect(keyboard[2][0].text).toContain('Call 1930 Helpline');
    expect((keyboard[2][0] as { url: string }).url).toContain('/r/call1930');
    expect(keyboard[3][0].text).toContain('This is genuine');
    expect((keyboard[3][0] as { callback_data: string }).callback_data).toBe(`dismiss_genuine:${alertId}`);
  });

  it('provides tailored advice for scam categories', () => {
    expect(getScamAdvice('authority')).toContain('Police, CBI and courts never make phone calls');
    expect(getScamAdvice('money')).toContain('Never transfer funds');
    expect(getScamAdvice('remote_app')).toContain('Do not install AnyDesk');
    expect(getScamAdvice('accident')).toContain('Call your family member directly');
  });

  it('builds member alert payload with 2-way verification callbacks', () => {
    const payload = buildMemberAlertPayload(alertId, 'Vikram Sharma');
    expect(payload.text).toContain('Someone is using <b>your voice</b> to call <b>Vikram Sharma</b>');
    expect(payload.text).toContain('Is it you on this call?');

    const keyboard = payload.replyMarkup.inline_keyboard;
    expect(keyboard[0][0].text).toContain("Yes, it's me");
    expect(keyboard[0][0].callback_data).toBe(`verify_yes:${alertId}`);
    expect(keyboard[0][1].text).toContain("No, it's a scam!");
    expect(keyboard[0][1].callback_data).toBe(`verify_no:${alertId}`);
  });
});
