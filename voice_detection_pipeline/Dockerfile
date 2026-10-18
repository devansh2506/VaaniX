FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libsndfile1 \
    libasound2-dev \
    portaudio19-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt || true

COPY . .

ENV VOICE_DETECTION_PORT=8765
ENV VOICE_DETECTION_STUB=1
EXPOSE 8765

CMD ["python", "server.py"]
