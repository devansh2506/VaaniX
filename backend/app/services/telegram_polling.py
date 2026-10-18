import asyncio
import logging
from app.config import settings
from app.db.session import async_session_maker
from app.services.telegram_bot import telegram_api_call
from app.routers.telegram_webhook import process_telegram_update

logger = logging.getLogger(__name__)


async def poll_telegram_loop():
    """Continuously polls Telegram Bot API for updates in dev mode."""
    if not settings.TELEGRAM_BOT_TOKEN or settings.TELEGRAM_BOT_TOKEN.startswith("your_"):
        logger.info("Telegram polling skipped: No valid TELEGRAM_BOT_TOKEN provided.")
        return

    logger.info("Starting Telegram polling worker...")
    offset = None

    while True:
        try:
            params = {"timeout": 10}
            if offset is not None:
                params["offset"] = offset

            updates = await telegram_api_call("getUpdates", params)

            if isinstance(updates, list):
                for update in updates:
                    offset = update.get("update_id", 0) + 1
                    try:
                        async with async_session_maker() as session:
                            await process_telegram_update(update, session)
                    except Exception as err:
                        logger.error(f"Error processing Telegram update {update.get('update_id')}: {err}")

        except asyncio.CancelledError:
            logger.info("Telegram polling worker cancelled.")
            break
        except Exception as err:
            logger.warning(f"Telegram polling error: {err}. Retrying in 5 seconds...")
            await asyncio.sleep(5)
