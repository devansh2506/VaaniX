/**
 * SatyaVoice / VaaniX Telegram Bot Helper & Alert Dispatcher
 * Directly integrates with Telegram Bot API (Roadmap Section 9).
 */

import { signAlertLink } from '@/lib/link-signing';
import { createAdminClient } from '@/lib/supabase/admin';

export interface TelegramSendResult {
  ok: boolean;
  messageId?: number;
  error?: string;
}

export function getScamAdvice(scamType?: string | null): string {
  switch (scamType) {
    case 'money':
    case 'otp_pin':
      return 'Never transfer funds or share verification codes on an incoming call.';
    case 'remote_app':
      return 'Do not install AnyDesk, TeamViewer or screen sharing APKs.';
    case 'authority':
      return 'Police, CBI and courts never make phone calls to place citizens under "digital arrest".';
    case 'accident':
      return 'Call your family member directly on their known personal phone before sending money.';
    default:
      return 'Hang up and verify the caller through an independent trusted channel.';
  }
}

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: Record<string, unknown>
): Promise<TelegramSendResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return {
      ok: false,
      error: 'TELEGRAM_BOT_TOKEN is not configured in environment variables.',
    };
  }

  try {
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    };

    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      return {
        ok: false,
        error: data.description || `Telegram API error HTTP ${response.status}`,
      };
    }

    return {
      ok: true,
      messageId: data.result?.message_id,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error contacting Telegram API',
    };
  }
}

export function buildOwnerAlertPayload(
  alertId: string,
  callerNumber: string | null | undefined,
  riskScore: number,
  claimLabel: string | null | undefined,
  scamWords: string[] = [],
  scamType?: string | null
) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const cyberSigned = signAlertLink(alertId, 'cyber');
  const bankSigned = signAlertLink(alertId, 'bank');

  const formattedTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const wordsSnippet = scamWords.slice(0, 3).join(', ');
  const advice = getScamAdvice(scamType);

  const text = [
    '⚠️ <b>AI-cloned voice detected</b>',
    `Call from <code>${callerNumber || 'Unknown'}</code> · ${formattedTime}`,
    `Risk <b>${riskScore}/100</b>`,
    `Claimed to be: <b>${claimLabel || 'Unknown'}</b>`,
    wordsSnippet ? `Said: &ldquo;${wordsSnippet}&rdquo;` : null,
    `\n<i>${advice}</i>`,
  ]
    .filter(Boolean)
    .join('\n');

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: '🛡 Report to Cyber Crime',
          url: `${siteUrl}/r/cyber/${alertId}?t=${cyberSigned}`,
        },
      ],
      [
        {
          text: '🏦 Report to Bank',
          url: `${siteUrl}/r/bank/${alertId}?t=${bankSigned}`,
        },
      ],
      [
        {
          text: '📞 Call 1930 Helpline',
          url: `${siteUrl}/r/call1930`,
        },
      ],
      [
        {
          text: '✓ This is genuine',
          callback_data: `dismiss_genuine:${alertId}`,
        },
      ],
    ],
  };

  return { text, replyMarkup };
}

export function buildMemberAlertPayload(
  alertId: string,
  ownerName: string
) {
  const text = `🚨 Someone is using <b>your voice</b> to call <b>${ownerName}</b> right now.\n\nIs it you on this call?`;

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: '✓ Yes, it\'s me',
          callback_data: `verify_yes:${alertId}`,
        },
        {
          text: '🚨 No, it\'s a scam!',
          callback_data: `verify_no:${alertId}`,
        },
      ],
    ],
  };

  return { text, replyMarkup };
}

export interface DispatchAlertParams {
  alertId: string;
  checkId: string;
  userId: string;
  callerNumber?: string | null;
  riskScore: number;
  claimLabel?: string | null;
  scamWords?: string[];
  scamType?: string | null;
  impersonatedMemberId?: string | null;
}

/**
 * Dispatches 2-way Telegram alerts to both the owner and the impersonated family member,
 * logging every dispatch attempt honestly in alert_messages.
 */
export async function dispatch2WayAlerts(params: DispatchAlertParams) {
  const admin = createAdminClient();

  // 1. Fetch owner profile details (chat ID and display name)
  const { data: ownerProfile } = await admin
    .from('profiles')
    .select('display_name, telegram_chat_id')
    .eq('id', params.userId)
    .single();

  const ownerName = ownerProfile?.display_name || 'your family';
  let userTelegramOk = false;
  let memberTelegramOk: boolean | null = null;

  // 2. Dispatch alert to owner
  if (ownerProfile?.telegram_chat_id) {
    const { text, replyMarkup } = buildOwnerAlertPayload(
      params.alertId,
      params.callerNumber,
      params.riskScore,
      params.claimLabel,
      params.scamWords,
      params.scamType
    );

    const sendRes = await sendTelegramMessage(ownerProfile.telegram_chat_id, text, replyMarkup);
    userTelegramOk = sendRes.ok;

    await admin.from('alert_messages').insert({
      alert_id: params.alertId,
      recipient: 'user',
      chat_id: ownerProfile.telegram_chat_id,
      telegram_message_id: sendRes.messageId || null,
      ok: sendRes.ok,
      error: sendRes.error || null,
    });
  }

  // 3. Dispatch alert to impersonated family member if member ID is known
  if (params.impersonatedMemberId) {
    const { data: member } = await admin
      .from('family_members')
      .select('name, telegram_chat_id')
      .eq('id', params.impersonatedMemberId)
      .single();

    if (member?.telegram_chat_id) {
      const { text, replyMarkup } = buildMemberAlertPayload(params.alertId, ownerName);
      const memberSendRes = await sendTelegramMessage(member.telegram_chat_id, text, replyMarkup);
      memberTelegramOk = memberSendRes.ok;

      await admin.from('alert_messages').insert({
        alert_id: params.alertId,
        recipient: 'member',
        chat_id: member.telegram_chat_id,
        telegram_message_id: memberSendRes.messageId || null,
        ok: memberSendRes.ok,
        error: memberSendRes.error || null,
      });
    } else {
      memberTelegramOk = null; // Member not joined Telegram yet
    }
  }

  return { userTelegramOk, memberTelegramOk };
}
