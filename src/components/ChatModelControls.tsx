import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Bug, CheckCircle2, Copy, Loader2, X, XCircle } from 'lucide-react';
import type { ElaraSettings } from '../types';
import { AVAILABLE_MODELS } from '../types';
import { loadSettings, saveSettings } from '../lib/storage';
import { runGeminiMinimalProbe, type GeminiMinimalProbeResult } from '../lib/geminiMinimalProbe';

export const ChatModelControls: React.FC = () => {
  const [settings, setSettings] = useState<ElaraSettings>(() => loadSettings());
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [probe, setProbe] = useState<GeminiMinimalProbeResult | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setSettings(loadSettings());
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('storage', sync);
    document.addEventListener('mousedown', close);
    return () => {
      window.removeEventListener('storage', sync);
      document.removeEventListener('mousedown', close);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const selectedId = settings.model?.trim() || 'gemini-3.7-flash';
  const configuredIds = [selectedId, ...(settings.reliabilitySettings?.fallbackModels ?? [])]
    .map((id) => id?.trim())
    .filter((id, index, list): id is string => Boolean(id) && list.findIndex((item) => item.toLowerCase() === id.toLowerCase()) === index);
  const selectedMeta = AVAILABLE_MODELS.find((model) => model.id.toLowerCase() === selectedId.toLowerCase());
  const selectedLabel = selectedMeta?.name ?? `${selectedId} (unavailable)`;

  const chooseModel = (model: string) => {
    const next = { ...settings, model };
    saveSettings(next);
    setSettings(next);
    setOpen(false);
  };

  const testConnection = async () => {
    if (testing) return;
    setTesting(true);
    try {
      setProbe(await runGeminiMinimalProbe(settings.apiKey?.trim() ?? '', selectedId));
    } finally {
      setTesting(false);
    }
  };

  const debugReport = probe
    ? JSON.stringify(
        {
          phase: 'GEMINI_MINIMAL_CONNECTION_TEST',
          result: probe.ok ? 'SUCCESS' : 'FAILURE',
          model: probe.model,
          latency_ms: probe.latencyMs,
          failure_stage: probe.stage,
          provider_error: probe.error ?? null,
          environment: {
            origin: window.location.origin,
            path: window.location.pathname,
            online: navigator.onLine,
            api_key_present: Boolean(settings.apiKey?.trim()),
          },
          request_contract: {
            contents: [{ role: 'user', parts: [{ text: 'hello' }] }],
            system_instruction: false,
            history: false,
            tools: false,
            thinking_config: false,
            oauth: false,
            retries: false,
            fallback: false,
          },
        },
        null,
        2,
      )
    : '';

  const copyDebug = async () => {
    if (debugReport) await navigator.clipboard?.writeText(debugReport);
  };

  return (
    <div ref={rootRef} className="relative flex shrink-0 items-center gap-2 whitespace-nowrap">
      <div className="relative shrink-0">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex h-9 w-[min(16rem,44vw)] max-w-[16rem] min-w-0 items-center justify-between gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-left text-[11px] font-semibold text-zinc-200 hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        >
          <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
        </button>

        {open && (
          <div
            role="listbox"
            aria-label="Preferred models"
            className="absolute bottom-full left-0 z-[100] mb-2 w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 p-1.5 shadow-2xl"
          >
            <div className="px-2.5 py-1.5 text-[9px] uppercase tracking-[0.16em] text-zinc-600">Preferred order</div>
            {configuredIds.map((id, index) => {
              const meta = AVAILABLE_MODELS.find((model) => model.id.toLowerCase() === id.toLowerCase());
              const selected = id.toLowerCase() === selectedId.toLowerCase();
              return (
                <button
                  key={id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => chooseModel(id)}
                  className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[11px] ${
                    selected ? 'bg-sky-950/50 text-sky-200' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 font-mono text-[9px] text-zinc-500">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{meta?.name ?? `${id} (unavailable)`}</span>
                  {selected && <Check className="h-3.5 w-3.5 shrink-0 text-sky-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => void testConnection()}
        disabled={testing}
        aria-label="Test Gemini connection"
        className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-[10px] font-semibold text-zinc-300 hover:border-amber-600/60 hover:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bug className="h-3.5 w-3.5" />}
        Test
      </button>

      {probe && (
        <div className="absolute bottom-full left-0 z-[110] mb-2 w-[min(92vw,44rem)] max-h-[70vh] overflow-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-zinc-200 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {probe.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
              <div>
                <div className="text-sm font-semibold">{probe.ok ? 'Gemini connection succeeded' : 'Gemini connection failed'}</div>
                <div className="mt-1 text-[10px] text-zinc-500">model={probe.model} · latency_ms={probe.latencyMs} · stage={probe.stage}</div>
              </div>
            </div>
            <button type="button" onClick={() => setProbe(null)} aria-label="Close result" className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200">
              <X className="h-4 w-4" />
            </button>
          </div>

          {!probe.ok && (
            <div className="mt-3 rounded-xl border border-red-900/50 bg-red-950/20 p-3 font-mono text-[10px] text-zinc-300">
              <div>provider_status: {probe.error?.status ?? 'null'}</div>
              <div>provider_code: {probe.error?.code ?? 'null'}</div>
              <div className="mt-1 whitespace-pre-wrap break-words">provider_message: {probe.error?.message || 'none'}</div>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button type="button" onClick={() => void copyDebug()} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-[10px] font-semibold text-zinc-300 hover:text-white">
              <Copy className="h-3.5 w-3.5" /> Copy debug report
            </button>
          </div>
          <pre className="mt-3 overflow-auto rounded-xl border border-zinc-800 bg-black/40 p-3 text-[10px] leading-relaxed text-zinc-300 whitespace-pre-wrap break-words">{debugReport}</pre>
        </div>
      )}
    </div>
  );
};
