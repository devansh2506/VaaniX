import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendTelegramMessage } from '@/lib/telegram/bot';

interface TelegramWebhookPayload {
  message?: {
    chat: { id: number };
    text?: string;
  };
  callback_query?: {
    id: string;
    data?: string;
  };
}

export async function POST(request: Request) {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  // 1. Verify Telegram secret token header if configured
  if (webhookSecret) {
    const receivedToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (!receivedToken || receivedToken !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized secret token' }, { status: 401 });
    }
  }

  let body: TelegramWebhookPayload;
  try {
    body = (await request.json()) as TelegramWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const admin = createAdminClient();

  // 2. Handle Text Messages (/start tokens)
  if (body.message && body.message.text) {
    const chatId = body.message.chat.id;
    const text: string = body.message.text.trim();

    // Owner Linking: /start u_<token>
    if (text.startsWith('/start u_')) {
      const token = text.replace('/start u_', '').trim();
      if (/^[A-Za-z0-9_-]{1,64}$/.test(token)) {
        const { data: profile, error } = await admin
          .from('profiles')
          .update({ telegram_chat_id: chatId })
          .eq('telegram_link_token', token)
          .select('display_name')
          .single();

        if (profile && !error) {
          await sendTelegramMessage(
            chatId,
            `✅ <b>VaaniX alerts connected.</b>\n\nWhen high-risk AI voice clones are identified, instant alerts with one-tap reporting actions will be dispatched directly to this chat.`
          );
          return NextResponse.json({ ok: true, linked: 'owner' });
        }
      }

      await sendTelegramMessage(
        chatId,
        `⚠️ Invalid or expired connection token. Please copy the current link from your VaaniX Settings page.`
      );
      return NextResponse.json({ ok: false, error: 'invalid_token' });
    }

    // Family Member Linking: /start m_<token>
    if (text.startsWith('/start m_')) {
      const token = text.replace('/start m_', '').trim();
      if (/^[A-Za-z0-9_-]{1,64}$/.test(token)) {
        const { data: member, error } = await admin
          .from('family_members')
          .update({
            telegram_chat_id: chatId,
            joined_at: new Date().toISOString(),
          })
          .eq('join_token', token)
          .select('name, relationship, user_id')
          .single();

        if (member && !error) {
          // Fetch owner's display name
          const { data: owner } = await admin
            .from('profiles')
            .select('display_name')
            .eq('id', member.user_id)
            .single();

          const ownerName = owner?.display_name || 'your family';
          await sendTelegramMessage(
            chatId,
            `🛡 You are now protecting <b>${ownerName}</b> as their <b>${member.relationship}</b>.\n\nIf someone uses your voice to call them, you will receive an instant verification message here.`
          );
          return NextResponse.json({ ok: true, linked: 'member' });
        }
      }

      await sendTelegramMessage(
        chatId,
        `⚠️ Invalid or expired invitation token. Please request a new invite link from the family group owner.`
      );
      return NextResponse.json({ ok: false, error: 'invalid_token' });
    }

    // General message reply
    await sendTelegramMessage(
      chatId,
      `VaaniX scam protection bot is active. Use your personal pairing link from the website to connect alerts.`
    );
    return NextResponse.json({ ok: true, handled: 'message' });
  }

  // 3. Handle Callback Queries (Button Clicks)
  if (body.callback_query) {
    const callbackId = body.callback_query.id;
    const callbackData: string = body.callback_query.data || '';
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    const answerCallback = async (text: string) => {
      if (!botToken) return;
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: callbackId, text, show_alert: true }),
        });
      } catch {
        // Ignore answerCallbackQuery failures
      }
    };

    // Callback 1: Impersonated Member confirms "No, it's a scam"
    if (callbackData.startsWith('verify_no:')) {
      const alertId = callbackData.replace('verify_no:', '');

      const { data: alert } = await admin
        .from('alerts')
        .select('id, check_id, user_id, impersonated_member_id')
        .eq('id', alertId)
        .single();

      if (alert) {
        // Update alert status
        await admin
          .from('alerts')
          .update({
            status: 'confirmed_scam',
            member_response: 'scam',
            updated_at: new Date().toISOString(),
          })
          .eq('id', alertId);

        // Fetch check and member name
        const [checkRes, memberRes, ownerRes] = await Promise.all([
          admin.from('checks').select('caller_e164, scam_type').eq('id', alert.check_id).single(),
          alert.impersonated_member_id
            ? admin.from('family_members').select('name').eq('id', alert.impersonated_member_id).single()
            : Promise.resolve({ data: null }),
          admin.from('profiles').select('telegram_chat_id').eq('id', alert.user_id).single(),
        ]);

        const memberName = memberRes.data?.name || 'Your family member';

        // Add to Scam Radar: impersonation_denied
        if (checkRes.data?.caller_e164) {
          try {
            await admin.from('radar_reports').insert({
              number_e164: checkRes.data.caller_e164,
              reporter_user_id: alert.user_id,
              source: 'impersonation_denied',
              check_id: alert.check_id,
              scam_type: checkRes.data.scam_type || 'family_impersonation',
            });
          } catch (rErr) {
            console.warn('[webhook] radar report insertion note:', rErr);
          }
        }

        // Notify owner in Telegram
        if (ownerRes.data?.telegram_chat_id) {
          await sendTelegramMessage(
            ownerRes.data.telegram_chat_id,
            `🚨 <b>${memberName} confirmed: It is NOT them on this call.</b>\n\nThis call is a confirmed voice clone scam. Do not transfer funds or respond.`
          );
        }

        await answerCallback(`🚨 Scam confirmed. Notification sent to the caller.`);
        return NextResponse.json({ ok: true, action: 'confirmed_scam' });
      }
    }

    // Callback 2: Impersonated Member confirms "Yes, it's me"
    if (callbackData.startsWith('verify_yes:')) {
      const alertId = callbackData.replace('verify_yes:', '');

      const { data: alert } = await admin
        .from('alerts')
        .select('id, user_id, impersonated_member_id')
        .eq('id', alertId)
        .single();

      if (alert) {
        await admin
          .from('alerts')
          .update({
            status: 'verified_genuine',
            member_response: 'genuine',
            updated_at: new Date().toISOString(),
          })
          .eq('id', alertId);

        const [memberRes, ownerRes] = await Promise.all([
          alert.impersonated_member_id
            ? admin.from('family_members').select('name').eq('id', alert.impersonated_member_id).single()
            : Promise.resolve({ data: null }),
          admin.from('profiles').select('telegram_chat_id').eq('id', alert.user_id).single(),
        ]);

        const memberName = memberRes.data?.name || 'Your family member';

        if (ownerRes.data?.telegram_chat_id) {
          await sendTelegramMessage(
            ownerRes.data.telegram_chat_id,
            `✅ <b>${memberName} confirmed: It really is them on the call.</b>`
          );
        }

        await answerCallback(`✅ Confirmed genuine.`);
        return NextResponse.json({ ok: true, action: 'verified_genuine' });
      }
    }

    // Callback 3: Owner marks "This is genuine"
    if (callbackData.startsWith('dismiss_genuine:')) {
      const alertId = callbackData.replace('dismiss_genuine:', '');

      const { data: alert } = await admin
        .from('alerts')
        .select('id, check_id, user_id')
        .eq('id', alertId)
        .single();

      if (alert) {
        await admin
          .from('alerts')
          .update({
            status: 'dismissed_genuine',
            updated_at: new Date().toISOString(),
          })
          .eq('id', alertId);

        // Record feedback
        await admin.from('feedback').insert({
          check_id: alert.check_id,
          user_id: alert.user_id,
          label: 'genuine',
        });

        // Exclude from Scam Radar counts
        await admin
          .from('radar_reports')
          .update({ excluded: true })
          .eq('check_id', alert.check_id);

        await answerCallback(`Marked as genuine. Excluded from Scam Radar counts.`);
        return NextResponse.json({ ok: true, action: 'dismissed_genuine' });
      }
    }

    await answerCallback('Action recorded.');
    return NextResponse.json({ ok: true, handled: 'callback_query' });
  }

  return NextResponse.json({ ok: true, ignored: true });
}
