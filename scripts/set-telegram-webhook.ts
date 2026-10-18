/**
 * SatyaVoice - Telegram Webhook Configuration Script
 *
 * Sets the Telegram Bot webhook to forward incoming messages and button callbacks
 * to /api/telegram/webhook, secured by TELEGRAM_WEBHOOK_SECRET.
 *
 * Usage:
 *   npx tsx scripts/set-telegram-webhook.ts [optional-public-url]
 */

async function main() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const rawBaseUrl = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const baseUrl = rawBaseUrl.replace(/\/$/, '');

  if (!botToken) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN environment variable is missing.');
    process.exit(1);
  }

  const webhookEndpoint = `${baseUrl}/api/telegram/webhook`;

  console.log('--- SatyaVoice Telegram Webhook Setup ---');
  console.log(`Target Webhook Endpoint: ${webhookEndpoint}`);
  console.log(`Secret Token Verification: ${webhookSecret ? 'Configured ✓' : 'None (Optional)'}`);

  const payload: Record<string, unknown> = {
    url: webhookEndpoint,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: false,
  };

  if (webhookSecret) {
    payload.secret_token = webhookSecret;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.ok) {
      console.log('✅ Webhook registered successfully with Telegram Bot API!');
      console.log('Description:', data.description || 'Webhook was set');

      // Fetch webhook info to confirm
      const infoRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
      const infoData = await infoRes.json();
      console.log('\nCurrent Webhook Status:');
      console.log(JSON.stringify(infoData.result, null, 2));
    } else {
      console.error('❌ Telegram API error while setting webhook:');
      console.error(data);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Network error communicating with Telegram API:', err);
    process.exit(1);
  }
}

main();
