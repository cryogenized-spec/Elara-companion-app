import { GoogleGenAI } from '@google/genai';

export interface GeminiMinimalProbeResult {
  ok: boolean;
  model: string;
  latencyMs: number;
  stage: 'before-stream' | 'after-stream';
  text?: string;
  error?: {
    name?: string;
    message: string;
    status?: number;
    statusText?: string;
    code?: string;
    raw?: string;
  };
}

function extractError(error: unknown): GeminiMinimalProbeResult['error'] {
  const value = error as any;
  const raw = typeof value?.message === 'string' ? value.message : String(error);
  let parsed: any = null;
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    parsed = null;
  }

  const source = parsed?.error || parsed || value;
  return {
    name: value?.name,
    message: typeof source?.message === 'string' ? source.message : raw,
    status: Number.isFinite(source?.code) ? source.code : (Number.isFinite(value?.status) ? value.status : undefined),
    statusText: source?.statusText || value?.statusText,
    code: source?.status || source?.reason || value?.code,
    raw,
  };
}

export async function runGeminiMinimalProbe(apiKey: string, model: string): Promise<GeminiMinimalProbeResult> {
  const selectedModel = model.replace(/^models\//, '').trim();
  const startedAt = Date.now();

  if (!apiKey.trim()) {
    return {
      ok: false,
      model: selectedModel,
      latencyMs: 0,
      stage: 'before-stream',
      error: { message: 'No Gemini API key is configured.' },
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const stream = await ai.models.generateContentStream({
      model: selectedModel,
      contents: [{ role: 'user', parts: [{ text: 'hello' }] }],
    });

    let text = '';
    try {
      for await (const chunk of stream) {
        const chunkText = chunk.text || '';
        text += chunkText;
      }
    } catch (error) {
      return {
        ok: false,
        model: selectedModel,
        latencyMs: Date.now() - startedAt,
        stage: 'after-stream',
        error: extractError(error),
      };
    }

    return {
      ok: true,
      model: selectedModel,
      latencyMs: Date.now() - startedAt,
      stage: 'after-stream',
      text,
    };
  } catch (error) {
    return {
      ok: false,
      model: selectedModel,
      latencyMs: Date.now() - startedAt,
      stage: 'before-stream',
      error: extractError(error),
    };
  }
}
