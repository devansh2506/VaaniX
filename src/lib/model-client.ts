/**
 * SatyaVoice / VaaniX Model Client
 * Communicates with the local or tunneled Python voice detection server.
 */

export interface ModelVoiceResult {
  spoof_prob: number;
  real_prob: number;
  stub: boolean;
}

export interface ModelTranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface ModelTranscriptResult {
  text: string;
  language: string;
  segments: ModelTranscriptSegment[];
}

export interface ModelClaimResult {
  type: 'family' | 'authority' | 'none';
  member_id: string | null;
  label: string | null;
  source: string;
  candidates: string[];
}

export interface ModelTextAnalysisResult {
  groups: string[];
  matched_words: string[];
  text_score: number;
  claim: ModelClaimResult;
}

export interface ModelAnalysisResponse {
  voice: ModelVoiceResult;
  transcript: ModelTranscriptResult;
  text_analysis: ModelTextAnalysisResult;
  timings_ms: {
    voice: number;
    stt: number;
    total: number;
  };
}

export interface FamilyMemberContext {
  id: string;
  name: string;
  aliases: string[];
  relationship: string;
}

export type ModelClientResult =
  | { ok: true; data: ModelAnalysisResponse }
  | { ok: false; error: 'OFFLINE' | 'UNAUTHORIZED' | 'TIMEOUT' | 'SERVER_ERROR'; message: string };

export async function analyzeAudioWithModel(
  audioBlob: Blob,
  filename = 'recording.wav',
  members?: FamilyMemberContext[]
): Promise<ModelClientResult> {
  const modelUrl = process.env.MODEL_SERVER_URL || 'http://127.0.0.1:8765';
  const modelSecret = process.env.MODEL_SERVER_SECRET || '';

  const formData = new FormData();
  formData.append('audio', audioBlob, filename);

  if (members && members.length > 0) {
    formData.append('members', JSON.stringify(members));
  }

  const headers: Record<string, string> = {};
  if (modelSecret) {
    headers['X-Model-Secret'] = modelSecret;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 65000); // 65 s timeout

    const response = await fetch(`${modelUrl}/analyze`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      return {
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Invalid or missing X-Model-Secret header configured for the model server.',
      };
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      return {
        ok: false,
        error: 'SERVER_ERROR',
        message: errJson.error || `Model server responded with HTTP status ${response.status}`,
      };
    }

    const data: ModelAnalysisResponse = await response.json();
    return { ok: true, data };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        ok: false,
        error: 'TIMEOUT',
        message: 'Model analysis timed out after 65 seconds.',
      };
    }

    return {
      ok: false,
      error: 'OFFLINE',
      message: 'The voice analysis model server is offline or unreachable.',
    };
  }
}

export async function getModelHealth(): Promise<{ status: string; stub?: boolean } | null> {
  const modelUrl = process.env.MODEL_SERVER_URL || 'http://127.0.0.1:8765';
  try {
    const res = await fetch(`${modelUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
