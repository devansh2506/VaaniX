'use client';

import * as React from 'react';
import { encodeWavPCM16 } from '@/lib/wav-encoder';
import type { ScoreResult } from '@/lib/scoring/config';

export type VoiceCheckState =
  | 'idle'
  | 'countdown'
  | 'recording'
  | 'analyzing'
  | 'complete'
  | 'offline'
  | 'error';

export interface VoiceCheckResult extends ScoreResult {
  id?: string;
  source: 'web_mic' | 'web_upload';
  callerNumber?: string | null;
  transcript: string;
  transcriptLanguage: string;
  transcriptSegments: Array<{ start: number; end: number; text: string }>;
  scamGroups: string[];
  scamWords: string[];
  claim: {
    type: 'family' | 'authority' | 'none';
    memberId: string | null;
    label: string | null;
    source: string;
  };
  isStub: boolean;
  alertId?: string | null;
  timingsMs: {
    voice: number;
    stt: number;
    total: number;
  };
  alertSent?: {
    telegramUser: boolean;
    telegramMember: boolean | null;
  };
}

interface UseVoiceCheckOptions {
  endpoint?: string; // '/api/checks' or '/api/try'
}

export function useVoiceCheck({ endpoint = '/api/checks' }: UseVoiceCheckOptions = {}) {
  const [state, setState] = React.useState<VoiceCheckState>('idle');
  const [countdown, setCountdown] = React.useState(5);
  const [recordSecondsRemaining, setRecordSecondsRemaining] = React.useState(10);
  const [audioLevel, setAudioLevel] = React.useState(0);
  const [result, setResult] = React.useState<VoiceCheckResult | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [lastBlob, setLastBlob] = React.useState<Blob | null>(null);
  const [lastCallerNumber, setLastCallerNumber] = React.useState<string | null>(null);

  // References for audio context and active streams
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const pcmSamplesRef = React.useRef<Float32Array[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const cleanupAudio = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  React.useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  const submitAudio = React.useCallback(
    async (blob: Blob, callerNumber?: string | null, source: 'web_mic' | 'web_upload' = 'web_mic') => {
      setState('analyzing');
      setErrorMessage(null);

      const formData = new FormData();
      formData.append('audio', blob, source === 'web_mic' ? 'mic_recording.wav' : 'uploaded_audio.wav');
      formData.append('source', source);
      if (callerNumber) {
        formData.append('caller_number', callerNumber);
      }

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.status === 503 || data?.error?.code === 'MODEL_OFFLINE') {
          setState('offline');
          setErrorMessage(data?.error?.message || 'The model server is offline. Your recording is preserved.');
          return;
        }

        if (!response.ok) {
          throw new Error(data?.error?.message || `Check failed (status ${response.status})`);
        }

        setResult(data.check);
        setState('complete');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Analysis failed. Please check network connectivity.';
        if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror')) {
          setState('offline');
          setErrorMessage('Unable to reach analysis server. Keep this recording and retry when online.');
        } else {
          setState('error');
          setErrorMessage(msg);
        }
      }
    },
    [endpoint]
  );

  const startMicCheck = React.useCallback(
    async (callerNumber?: string) => {
      cleanupAudio();
      setResult(null);
      setErrorMessage(null);
      setLastCallerNumber(callerNumber || null);
      pcmSamplesRef.current = [];

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: false,
          },
        });
        streamRef.current = stream;

        // Step 1: 5 second countdown (skipping greetings)
        setState('countdown');
        setCountdown(5);

        let count = 5;
        await new Promise<void>((resolve) => {
          timerRef.current = setInterval(() => {
            count -= 1;
            setCountdown(count);
            if (count <= 0) {
              if (timerRef.current) clearInterval(timerRef.current);
              timerRef.current = null;
              resolve();
            }
          }, 1000);
        });

        // Step 2: 10 second audio recording
        setState('recording');
        setRecordSecondsRemaining(10);

        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioCtx({ sampleRate: 16000 });
        audioContextRef.current = audioCtx;

        const sourceNode = audioCtx.createMediaStreamSource(stream);
        // Use ScriptProcessor for raw PCM capture
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0);
          pcmSamplesRef.current.push(new Float32Array(input));

          // Level calculation (RMS)
          let sum = 0;
          for (let i = 0; i < input.length; i++) {
            sum += input[i] * input[i];
          }
          const rms = Math.sqrt(sum / input.length);
          setAudioLevel(Math.min(1, rms * 5));
        };

        sourceNode.connect(processor);
        processor.connect(audioCtx.destination);

        let recordSeconds = 10;
        await new Promise<void>((resolve) => {
          timerRef.current = setInterval(() => {
            recordSeconds -= 1;
            setRecordSecondsRemaining(recordSeconds);
            if (recordSeconds <= 0) {
              if (timerRef.current) clearInterval(timerRef.current);
              timerRef.current = null;
              resolve();
            }
          }, 1000);
        });

        // Step 3: Stop recording and concatenate samples
        cleanupAudio();

        const totalLength = pcmSamplesRef.current.reduce((acc, curr) => acc + curr.length, 0);
        const mergedSamples = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of pcmSamplesRef.current) {
          mergedSamples.set(chunk, offset);
          offset += chunk.length;
        }

        // Encode to WAV 16kHz mono
        const wavBlob = encodeWavPCM16(mergedSamples, 16000);
        setLastBlob(wavBlob);

        // Step 4: Auto-submit
        await submitAudio(wavBlob, callerNumber || null, 'web_mic');
      } catch (err: unknown) {
        cleanupAudio();
        setState('error');
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Microphone access denied or audio recording failed.'
        );
      }
    },
    [cleanupAudio, submitAudio]
  );

  const uploadAudioCheck = React.useCallback(
    async (file: File, callerNumber?: string) => {
      cleanupAudio();
      setResult(null);
      setErrorMessage(null);
      setLastCallerNumber(callerNumber || null);
      setLastBlob(file);

      await submitAudio(file, callerNumber || null, 'web_upload');
    },
    [cleanupAudio, submitAudio]
  );

  const retryCheck = React.useCallback(async () => {
    if (!lastBlob) return;
    await submitAudio(lastBlob, lastCallerNumber, 'web_mic');
  }, [lastBlob, lastCallerNumber, submitAudio]);

  const reset = React.useCallback(() => {
    cleanupAudio();
    setState('idle');
    setResult(null);
    setErrorMessage(null);
    setLastBlob(null);
    setLastCallerNumber(null);
  }, [cleanupAudio]);

  return {
    state,
    countdown,
    recordSecondsRemaining,
    audioLevel,
    result,
    errorMessage,
    recordedBlob: lastBlob,
    startMicCheck,
    uploadAudioCheck,
    retryCheck,
    reset,
  };
}
