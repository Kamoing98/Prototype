import { useCallback, useEffect, useRef, useState } from "react";
import { getEngine, STEPS, VOICES, type Pattern, type VoiceId } from "../audio/engine";
import { emptyPattern, PRESETS, patternsEqual } from "../audio/patterns";
import Visualizer from "./Visualizer";

const SAVE_KEY = "pulse8:session:v1";

interface Saved {
  pattern: Pattern;
  bpm: number;
  silent?: boolean;
}

function loadSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Saved;
    if (!parsed.pattern?.kick || parsed.pattern.kick.length !== STEPS) return null;
    return parsed;
  } catch {
    return null;
  }
}

/* ---- pivot S-2: pattern portability ---- */

function validatePatternJson(raw: string):
  | { ok: true; pattern: Pattern; bpm: number }
  | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Not valid JSON — check for trailing commas or stray quotes." };
  }
  const obj = parsed as { bpm?: unknown; pattern?: unknown };
  if (!obj || typeof obj !== "object" || !obj.pattern || typeof obj.pattern !== "object") {
    return { ok: false, error: 'Missing a "pattern" object.' };
  }
  const src = obj.pattern as Record<string, unknown>;
  const voices = ["kick", "snare", "hat", "clap"] as const;
  const next = emptyPattern();
  for (const v of voices) {
    const row = src[v];
    if (!Array.isArray(row) || row.length !== STEPS) {
      return { ok: false, error: `"pattern.${v}" must be an array of ${STEPS} booleans.` };
    }
    for (let i = 0; i < STEPS; i++) {
      if (typeof row[i] !== "boolean") {
        return { ok: false, error: `"pattern.${v}[${i}]" must be true or false.` };
      }
      next[v][i] = row[i];
    }
  }
  let bpm = typeof obj.bpm === "number" && Number.isFinite(obj.bpm) ? Math.round(obj.bpm) : 120;
  bpm = Math.min(180, Math.max(60, bpm));
  return { ok: true, pattern: next, bpm };
}

interface Props {
  onPlayingChange: (playing: boolean) => void;
}

export default function Sequencer({ onPlayingChange }: Props) {
  const engine = getEngine();

  const [pattern, setPattern] = useState<Pattern>(() => loadSaved()?.pattern ?? PRESETS[0].pattern);
  const [bpm, setBpm] = useState<number>(() => loadSaved()?.bpm ?? PRESETS[0].bpm);
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(-1);
  const [volume, setVolume] = useState(90);
  const [silent, setSilent] = useState<boolean>(() => loadSaved()?.silent ?? false);
  const [muted, setMuted] = useState<Record<VoiceId, boolean>>({
    kick: false,
    snare: false,
    hat: false,
    clap: false,
  });
  /* pivot S-2: portability UI state */
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const patternRef = useRef(pattern);
  patternRef.current = pattern;
  const tapsRef = useRef<number[]>([]);
  const flashTimer = useRef<number | null>(null);

  /* persist session (pattern + bpm + silent flag, schema-additive) */
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ pattern, bpm, silent }));
    } catch {
      /* private mode — non-fatal */
    }
  }, [pattern, bpm, silent]);

  /* keep engine bpm in sync */
  useEffect(() => {
    engine.setBpm(bpm);
  }, [engine, bpm]);

  /* keep engine clock domain in sync — restarts a running transport safely */
  useEffect(() => {
    engine.setSilent(silent);
  }, [engine, silent]);

  const showToast = (msg: string) => {
    setFlash(msg);
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 2200);
  };

  useEffect(
    () => () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    },
    []
  );

  /* playhead driven by the audio clock, not the React render cycle */
  useEffect(() => {
    if (!playing) {
      setPlayhead(-1);
      return;
    }
    let raf = 0;
    const loop = () => {
      setPlayhead((prev) => {
        const next = engine.getVisualStep();
        return prev === next ? prev : next;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, engine]);

  const setPlayingBoth = useCallback(
    (p: boolean) => {
      setPlaying(p);
      onPlayingChange(p);
    },
    [onPlayingChange]
  );

  const togglePlay = useCallback(() => {
    if (playing) {
      engine.stop();
      setPlayingBoth(false);
    } else {
      engine.resume();
      engine.start(() => patternRef.current);
      setPlayingBoth(true);
    }
  }, [playing, engine, setPlayingBoth]);

  /* spacebar transport */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "BUTTON" || t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      e.preventDefault();
      togglePlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay]);

  const toggleStep = (voice: VoiceId, step: number) => {
    engine.resume();
    const nowOn = !pattern[voice][step];
    if (nowOn) engine.preview(voice);
    setPattern((p) => {
      const row = [...p[voice]];
      row[step] = nowOn;
      return { ...p, [voice]: row };
    });
  };

  const toggleMute = (voice: VoiceId) => {
    setMuted((m) => {
      const next = { ...m, [voice]: !m[voice] };
      engine.muted = next;
      return next;
    });
  };

  const audition = (voice: VoiceId) => {
    engine.resume();
    engine.preview(voice);
  };

  const applyPreset = (idx: number) => {
    const preset = PRESETS[idx];
    setPattern(preset.pattern);
    setBpm(preset.bpm);
  };

  const clearAll = () => setPattern(emptyPattern());

  /* ---- pivot S-2: silent mode toggle ---- */
  const toggleSilent = () => {
    const next = !silent;
    // Engine swap happens synchronously inside this click gesture so a
    // re-created AudioContext is allowed to resume (autoplay policy).
    engine.setSilent(next);
    if (!next) engine.resume();
    showToast(next ? "SILENT MODE — ZERO AUDIO OUTPUT" : "AUDIO PATH RESTORED");
    setSilent(next);
  };

  /* ---- pivot S-2: pattern export (JSON download) ---- */
  const exportPattern = () => {
    const payload = {
      app: "PULSE-8",
      format: "pulse8-pattern",
      version: 1,
      exportedAt: new Date().toISOString(),
      bpm,
      pattern,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pulse8-${bpm}bpm.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("PATTERN EXPORTED ✓");
  };

  /* ---- pivot S-2: pattern import (paste + validate) ---- */
  const applyImport = () => {
    const result = validatePatternJson(importText.trim());
    if (!result.ok) {
      setImportMsg({ ok: false, text: result.error });
      return;
    }
    setPattern(result.pattern);
    setBpm(result.bpm);
    setImportMsg({ ok: true, text: `Loaded — ${bpm} → ${result.bpm} BPM applied.` });
    showToast("PATTERN IMPORTED ✓");
    window.setTimeout(() => {
      setShowImport(false);
      setImportText("");
      setImportMsg(null);
    }, 900);
  };

  const onTapTempo = () => {
    engine.resume();
    engine.preview("hat");
    const now = performance.now();
    const taps = tapsRef.current;
    if (taps.length && now - taps[taps.length - 1] > 2200) taps.length = 0;
    taps.push(now);
    if (taps.length > 6) taps.shift();
    if (taps.length >= 2) {
      const windowCount = Math.min(4, taps.length - 1);
      const span = taps[taps.length - 1] - taps[taps.length - 1 - windowCount];
      const interval = span / windowCount;
      const detected = Math.round(60000 / interval);
      if (detected >= 60 && detected <= 180) setBpm(detected);
    }
  };

  const activePreset = PRESETS.findIndex((p) => patternsEqual(p.pattern, pattern));

  return (
    <div className="panel scan rounded-xl p-4 sm:p-6">
      {/* corner screws */}
      <div className="screw absolute left-2.5 top-2.5" />
      <div className="screw absolute right-2.5 top-2.5" />
      <div className="screw absolute bottom-2.5 left-2.5" />
      <div className="screw absolute bottom-2.5 right-2.5" />

      {/* ---- transport row ---- */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-b border-ink-600/60 pb-5">
        <button
          onClick={togglePlay}
          aria-label={playing ? "Stop" : "Play"}
          className={`group flex h-14 w-14 items-center justify-center rounded-lg border transition-all duration-150 active:scale-90 ${
            playing
              ? "border-sig-amber bg-sig-amber/15 text-sig-amber shadow-[0_0_22px_rgba(255,176,58,0.35)]"
              : "border-ink-500 bg-ink-800 text-ink-200 hover:border-sig-amber hover:text-sig-amber"
          }`}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5 translate-x-[1px] fill-current" aria-hidden>
              <path d="M7 4.5v15l13-7.5-13-7.5z" />
            </svg>
          )}
        </button>

        <div className="flex items-baseline gap-2">
          <span className="font-mono text-4xl font-semibold tabular-nums text-ink-100 sm:text-5xl">
            {bpm}
          </span>
          <span className="font-display text-xs font-semibold tracking-[0.25em] text-ink-300">BPM</span>
        </div>

        <div className="flex min-w-[180px] flex-1 items-center gap-3 sm:max-w-xs">
          <input
            type="range"
            min={60}
            max={180}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full"
            aria-label="Tempo in BPM"
          />
        </div>

        <button
          onClick={onTapTempo}
          className="rounded-md border border-ink-500 bg-ink-800 px-4 py-2 font-display text-xs font-semibold tracking-[0.2em] text-ink-200 transition-all hover:border-sig-amber hover:text-sig-amber active:scale-90"
        >
          TAP
        </button>

        {/* pivot S-2: silent mode — transport runs, no AudioContext, no output */}
        <button
          onClick={toggleSilent}
          role="switch"
          aria-checked={silent}
          title={silent ? "Restore audio output" : "Silent mode: zero audio output"}
          className={`flex items-center gap-2 rounded-md border px-3 py-2 transition-all active:scale-95 ${
            silent
              ? "border-sig-amber/70 bg-sig-amber/10 shadow-[0_0_14px_rgba(255,176,58,0.2)]"
              : "border-ink-500 bg-ink-800 hover:border-ink-300"
          }`}
        >
          <span
            className={`relative h-4 w-8 rounded-full border transition-colors ${
              silent ? "border-sig-amber/70 bg-sig-amber/25" : "border-ink-500 bg-ink-700"
            }`}
          >
            <span
              className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full transition-all duration-150 ${
                silent
                  ? "left-[calc(100%-0.875rem)] bg-sig-amber shadow-[0_0_8px_rgba(255,176,58,0.9)]"
                  : "left-0.5 bg-ink-300"
              }`}
            />
          </span>
          <span
            className={`font-display text-xs font-semibold tracking-[0.2em] ${
              silent ? "text-sig-amber" : "text-ink-200"
            }`}
          >
            SILENT
          </span>
        </button>

        <div
          className={`ml-auto flex items-center gap-3 transition-opacity ${
            silent ? "pointer-events-none opacity-35" : ""
          }`}
        >
          <span className="font-display text-[10px] font-semibold tracking-[0.25em] text-ink-400">
            MASTER
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              engine.setMasterVolume(v / 100);
            }}
            className="w-24"
            aria-label="Master volume"
          />
          <span className="w-8 font-mono text-xs text-ink-300">{volume}</span>
        </div>
      </div>

      {/* ---- step grid ---- */}
      <div className="mt-5 space-y-2">
        {VOICES.map((voice) => (
          <div key={voice.id} className="grid grid-cols-[8.5rem_1fr] items-center gap-3 sm:grid-cols-[11rem_1fr]">
            {/* voice header */}
            <div className="flex items-center gap-2 pr-1">
              <span
                className="h-6 w-1.5 shrink-0 rounded-full"
                style={{ background: voice.color, boxShadow: `0 0 8px ${voice.color}88` }}
              />
              <div className="min-w-0">
                <div className="font-display text-sm font-semibold tracking-[0.14em] text-ink-100">
                  {voice.label}
                </div>
                <div className="truncate font-mono text-[10px] text-ink-400">{voice.node}</div>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => audition(voice.id)}
                  title={`Audition ${voice.label}`}
                  className="flex h-6 w-6 items-center justify-center rounded border border-ink-600 text-ink-300 transition-colors hover:border-ink-300 hover:text-ink-100 active:scale-90"
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden>
                    <path d="M8 5v14l11-7-11-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => toggleMute(voice.id)}
                  title={muted[voice.id] ? `Unmute ${voice.label}` : `Mute ${voice.label}`}
                  className={`flex h-6 w-6 items-center justify-center rounded border font-mono text-[10px] font-semibold transition-all active:scale-90 ${
                    muted[voice.id]
                      ? "border-kick/70 bg-kick/15 text-kick"
                      : "border-ink-600 text-ink-400 hover:border-ink-300 hover:text-ink-200"
                  }`}
                >
                  M
                </button>
              </div>
            </div>

            {/* steps */}
            <div className="grid grid-cols-16 gap-1 sm:gap-1.5">
              {pattern[voice.id].map((hit, i) => {
                const isPlayhead = playhead === i;
                return (
                  <button
                    key={i}
                    onClick={() => toggleStep(voice.id, i)}
                    aria-label={`${voice.label} step ${i + 1} ${hit ? "on" : "off"}`}
                    className={`relative aspect-square rounded-[5px] border transition-all duration-100 ${
                      i % 4 === 0 ? "ml-1 sm:ml-1.5" : ""
                    } ${
                      hit
                        ? "pop border-transparent"
                        : "border-ink-600/70 bg-ink-800/80 hover:border-ink-300/70 hover:bg-ink-700"
                    } ${isPlayhead ? "brightness-125 ring-1 ring-white/30" : ""}`}
                    style={
                      hit
                        ? {
                            background: voice.color,
                            boxShadow: `0 0 12px ${voice.color}59, inset 0 0 6px rgba(255,255,255,0.28)`,
                            opacity: muted[voice.id] ? 0.35 : 1,
                          }
                        : undefined
                    }
                  >
                    {isPlayhead && !hit && (
                      <span className="absolute inset-0 rounded-[5px] bg-white/10" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* step numbers */}
        <div className="grid grid-cols-[8.5rem_1fr] gap-3 sm:grid-cols-[11rem_1fr]">
          <div />
          <div className="grid grid-cols-16 gap-1 sm:gap-1.5">
            {Array.from({ length: STEPS }, (_, i) => (
              <span
                key={i}
                className={`text-center font-mono text-[9px] leading-none sm:text-[10px] ${
                  i % 4 === 0 ? "ml-1 text-sig-amber/80 sm:ml-1.5" : "text-ink-500"
                }`}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ---- presets + scope ---- */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-ink-600/60 pt-5">
        <span className="mr-1 font-display text-[10px] font-semibold tracking-[0.25em] text-ink-400">
          PATTERNS
        </span>
        {PRESETS.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => applyPreset(idx)}
            className={`rounded-md border px-3 py-1.5 font-mono text-[11px] tracking-wider transition-all active:scale-95 ${
              activePreset === idx
                ? "border-sig-green/70 bg-sig-green/10 text-sig-green"
                : "border-ink-600 bg-ink-800 text-ink-300 hover:border-ink-300 hover:text-ink-100"
            }`}
          >
            {p.name}
          </button>
        ))}
        <button
          onClick={clearAll}
          className="rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 font-mono text-[11px] tracking-wider text-ink-300 transition-all hover:border-kick/70 hover:text-kick active:scale-95"
        >
          CLEAR
        </button>

        {/* pivot S-2: pattern portability */}
        <span className="mx-1 hidden h-4 w-px bg-ink-600 sm:block" />
        <button
          onClick={exportPattern}
          title="Download the pattern as a JSON file"
          className="rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 font-mono text-[11px] tracking-wider text-ink-300 transition-all hover:border-sig-cyan/70 hover:text-sig-cyan active:scale-95"
        >
          EXPORT
        </button>
        <button
          onClick={() => {
            setShowImport((s) => !s);
            setImportMsg(null);
          }}
          title="Paste a pattern JSON to load it"
          className={`rounded-md border px-3 py-1.5 font-mono text-[11px] tracking-wider transition-all active:scale-95 ${
            showImport
              ? "border-sig-cyan/70 bg-sig-cyan/10 text-sig-cyan"
              : "border-ink-600 bg-ink-800 text-ink-300 hover:border-sig-cyan/70 hover:text-sig-cyan"
          }`}
        >
          IMPORT
        </button>

        <span className="ml-auto hidden items-center gap-2 font-mono text-[10px] text-ink-400 sm:flex">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              playing ? "bg-sig-green led-fast shadow-[0_0_8px_rgba(92,217,127,0.9)]" : "bg-ink-500"
            }`}
          />
          {playing ? "SEQ RUNNING" : "SEQ IDLE"} · {silent ? "SILENT CLOCK" : "AUDIO CLOCK"} · 16 STEPS
        </span>
      </div>

      {/* inline toast */}
      {flash && (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-sig-green/40 bg-sig-green/8 px-3 py-2 font-mono text-[11px] tracking-wider text-sig-green">
          <span className="h-1.5 w-1.5 rounded-full bg-sig-green shadow-[0_0_6px_rgba(92,217,127,0.9)]" />
          {flash}
        </div>
      )}

      {/* pivot S-2: import panel */}
      {showImport && (
        <div className="mt-3 rounded-lg border border-ink-600/70 bg-ink-950/70 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="font-display text-[10px] font-semibold tracking-[0.25em] text-sig-cyan">
              IMPORT PATTERN · JSON
            </span>
            <button
              onClick={() => {
                setShowImport(false);
                setImportMsg(null);
              }}
              className="font-mono text-[10px] text-ink-400 transition-colors hover:text-ink-100"
            >
              CLOSE ✕
            </button>
          </div>
          <textarea
            value={importText}
            onChange={(e) => {
              setImportText(e.target.value);
              setImportMsg(null);
            }}
            placeholder={'{ "bpm": 120, "pattern": { "kick": [true, false, …16], "snare": […], "hat": […], "clap": […] } }'}
            spellCheck={false}
            className="term-scroll h-24 w-full resize-none rounded-md border border-ink-600 bg-ink-900 p-3 font-mono text-[11px] leading-relaxed text-ink-200 outline-none transition-colors placeholder:text-ink-500 focus:border-sig-cyan/60"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={applyImport}
              disabled={!importText.trim()}
              className="rounded-md border border-sig-cyan/60 bg-sig-cyan/10 px-4 py-1.5 font-display text-xs font-semibold tracking-[0.2em] text-sig-cyan transition-all hover:bg-sig-cyan/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              VALIDATE + LOAD
            </button>
            <span
              className={`font-mono text-[11px] ${
                importMsg ? (importMsg.ok ? "text-sig-green" : "text-kick") : "text-ink-500"
              }`}
            >
              {importMsg ? (importMsg.ok ? "✓ " : "✕ ") + importMsg.text : "shape: 4 voices × 16 booleans, bpm 60–180"}
            </span>
          </div>
        </div>
      )}

      <div className="mt-3 overflow-hidden rounded-lg border border-ink-600/70 bg-ink-950/70">
        <Visualizer engine={engine} playing={playing} silent={silent} pattern={pattern} />
      </div>
    </div>
  );
}
