import React, { useEffect, useMemo, useState } from 'react';
import { loadSettings, saveSettings } from '../lib/storage';
import { runGeminiMinimalProbe, type GeminiMinimalProbeResult } from '../lib/geminiMinimalProbe';
import { ChatModelControlsView } from './ChatModelControlsView';
import type { ElaraSettings } from '../types';

interface ReliabilitySettingsShape {
  fallbackModels?: string[];
}

type SettingsWithReliability = ElaraSettings & {
  reliabilitySettings?: ReliabilitySettingsShape;
};

export const ChatModelControls: React.FC = () => {
  const [settings, setSettings] = useState<SettingsWithReliability>(() => loadSettings() as SettingsWithReliability);
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [probe, setProbe] = useState<GeminiMinimalProbeResult | null>(null);

  useEffect(() => {
    const sync = () => setSettings(loadSettings() as SettingsWithReliability);
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-elara-model-controls]')) setOpen(false);
    };

    window.addEventListener('storage', sync);
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => {
      window.removeEventListener('storage', sync);
      document.removeEventListener('mousedown', closeOnOutsideClick);
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
  const modelIds = useMemo(() => {
    const ids = [selectedId, ...(settings.reliabilitySettings?.fallbackModels ?? [])];
    return ids.filter((id, index, list) => Boolean(id?.trim()) && list.findIndex((item) => item.toLowerCase() === id.toLowerCase()) === index);
  }, [selectedId, settings.reliabilitySettings?.fallbackModels]);

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

  const selectModel = (modelId: string) => {
    const next = { ...settings, model: modelId };
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

  const copyDebug = async () => {
    if (debugReport) await navigator.clipboard?.writeText(debugReport);
  };

  return (
    <div data-elara-model-controls className="relative shrink-0">
      <ChatModelControlsView
        selectedId={selectedId}
        modelIds={modelIds}
        open={open}
        testing={testing}
        probe={probe}
        onToggleOpen={() => setOpen((value) => !value)}
        onSelectModel={selectModel}
        onTest={() => void testConnection()}
        onCloseProbe={() => setProbe(null)}
        onCopyDebug={() => void copyDebug()}
        debugReport={debugReport}
      />
    </div>
  );
};
