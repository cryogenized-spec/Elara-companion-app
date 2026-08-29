import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Bug, CheckCircle2, Copy, Loader2, X, XCircle } from 'lucide-react';
import type { ElaraSettings } from '../types';
import { AVAILABLE_MODELS } from '../types';
import { loadSettings, saveSettings } from '../lib/storage';
import { runGeminiMinimalProbe, type GeminiMinimalProbeResult } from '../lib/geminiMinimalProbe';

interface ChatModelControlsProps {
  compact?: boolean;
}

export const ChatModelControls: React.FC<ChatModelControlsProps> = ({ compact = false }) => {
  const [settings, setSettings] = useState<ElaraSettings>(() => loadSettings());
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [probe, setProbe] = useState<GeminiMinimalProbeResult | null>(null);

  useEffect(() => {
    const sync = () => setSettings(loadSettings());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const options = useMemo(() => {
    const configured = [settings.model, ...(settings.reliabilitySettings?.fallbackModels || [])]
      .map((value) => value?.trim())
      .filter(Boolean) as string[];
    return configured.filter((value, index, list) => list.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index);
  }, [settings.model, settings.reliabilitySettings?.fallbackModels]);

  const selectedId = settings.model?.trim() || 'gemini-3.7-flash';
  const current = AVAILABLE_MODELS.find((item) => item.id.toLowerCase() === selectedId.toLowerCase());
  const currentLabel = current?.name || `${selectedId} (unavailable)`;

  const selectModel = (model: string) => {
    const next = { ...settings, model };
    setSettings(next);
    saveSettings(next);
    setOpen(false);
  };

  const runTest = async () => {
    if (testing) return;
    setTesting(true);
    try {
      setProbe(await runGeminiMinimalProbe(settings.apiKey || '', selectedId));
    } finally {
      setTesting(false);
    }
  };

  const debugText = probe ? JSON.stringify({
    phase: 'GEMINI_MINIMAL_CONNECTION_TEST',
    result: probe.ok ? 'SUCCESS' : 'FAILURE',
    model: probe.model,
    latency_ms: probe.latencyMs,
    stage: probe.stage,
    provider_error: probe.error || null,
    environment: {
      origin: window.location.origin,
      path: window.location.pathname,
      online: navigator.onLine,
      api_key_present: Boolean(settings.apiKey?.trim()),
    },
    request: {
      contents: [{ role: 'user', parts: [{ text: 'hello' }] }],
      config: 'omitted',
      tools: false,
      thinking: false,
      history: false,
      oauth: false,
    },
  }, null, 2) : '';

  const copyDebug = async () => {
    if (!debugText) return;
    await navigator.clipboard?.writeText(debugText);
  };

  return (
    <div className={`relative inline-flex shrink-0 flex-nowrap items-center gap-1.5 whitespace-nowrap ${compact ? '' : 'w-full'}`}>
      <div className="relative shrink-0">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Selected model: ${currentLabel}`}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-9 w-[min(15rem,42vw)] max-w-[15rem] shrink-0 items-center justify-between gap-2 rounded-xl border border-zinc-700 bg-zinc-950/90 px-2.5 text-[11px] font-semibold text-zinc-200 hover:border-zinc-600"
        >
          <span className="min-w-0 flex-1 truncate text-left">{currentLabel}</span>
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div role="listbox" aria-label="Preferred models" className="absolute bottom-full left-0 z-[100] mb-2 w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 p-1.5 shadow-2xl">
            <div className="px-2.5 py-1.5 text-[9px] uppercase tracking-[0.16em] text-zinc-600">Preferred order</div>
            {options.map((id, index) => {
              const meta = AVAILABLE_MODELS.find((item) => item.id.toLowerCase() === id.toLowerCase());
              const selected = id.toLowerCase() === selectedId.toLowerCase();
              return (
                <button key={id} type="button" role="option" aria-selected={selected} onClick={() => selectModel(id)} className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left ${selected ? 'bg-sky-950/40 text-sky-200' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'}`}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 font-mono text-[9px] text-zinc-500">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-[11px] font-medium">{meta?.name || `${id} (unavailable)`}</span>
                  {selected && <Check className="h-3.5 w-3.5 shrink-0 text-sky-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button type="button" disabled={testing} onClick={() => void runTest()} title="Test Gemini connection" aria-label="Test Gemini connection" className="inline-flex h-9 min-w-[4.25rem] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-950/90 px-2.5 text-[10px] font-semibold text-zinc-300 hover:border-amber-600/60 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50">
        {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bug className="h-3.5 w-3.5" />}
        <span>Test</span>
      </button>

      {probe && (
        <div className="absolute bottom-full left-0 z-[110] mb-2 max-h-[70vh] w-[min(92vw,720px)] overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950/98 p-4 text-zinc-200 shadow-2xl sm:left-auto sm:right-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {probe.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
              <div>
                <h3 className="text-sm font-semibold">{probe.ok ? 'Gemini minimal request succeeded' : 'Gemini minimal request failed'}</h3>
                <p className="mt-1 text-[11px] text-zinc-500">model={probe.model} · latency_ms={probe.latencyMs} · stage={probe.stage}</p>
              </div>
            </div>
            <button type="button" onClick={() => setProbe(null)} aria-label="Close test result" className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"><X className="h-4 w-4" /></button>
          </div>
          {!probe.ok && <div className="mt-3 rounded-xl border border-red-900/50 bg-red-950/20 p-3 font-mono text-[11px] leading-relaxed text-zinc-300"><div>provider_status: {probe.error?.status ?? 'null'}</div><div>provider_code: {probe.error?.code ?? 'null'}</div><div className="mt-1 whitespace-pre-wrap break-words">provider_message: {probe.error?.message || 'none'}</div></div>}
          <div className="mt-3 flex gap-2"><button type="button" onClick={() => void copyDebug()} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-[11px] font-semibold text-zinc-300 hover:text-white"><Copy className="h-3.5 w-3.5" /> Copy debug</button></div>
          <pre className="mt-3 max-h-[38vh] overflow-auto rounded-xl border border-zinc-800 bg-black/40 p-3 text-[10px] leading-relaxed text-zinc-300 whitespace-pre-wrap break-words">{debugText}</pre>
        </div>
      )}
    </div>
  );
};
