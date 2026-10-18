#!/usr/bin/env bash
set -e

# SatyaVoice / VaaniX Model Server Launcher
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo " Starting VaaniX Voice Analysis Server on http://127.0.0.1:8765"
echo "=========================================================="

if [ -d ".venv" ]; then
  source .venv/bin/activate
else
  echo "Error: .venv virtual environment not found in repository root."
  echo "Please create it and install requirements.txt first."
  exit 1
fi

export VOICE_DETECTION_PORT=8765

echo ""
echo "[1/2] Launching Python Flask server with Faster-Whisper + Nes2Net..."
echo "To expose to Vercel or remote web clients, run in a separate terminal:"
echo "    cloudflared tunnel --url http://127.0.0.1:8765"
echo ""
echo "[2/2] Then set your tunnel URL in .env or Vercel environment variables:"
echo "    MODEL_SERVER_URL=https://<your-tunnel-subdomain>.trycloudflare.com"
echo "=========================================================="

python voice_detection_pipeline/server.py
