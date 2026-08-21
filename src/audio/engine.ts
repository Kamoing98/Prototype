/*
 * PULSE-8 audio engine.
 * Everything is synthesized live — zero audio samples.
 *
 * Architecture learned from Chris Wilson's "A Tale of Two Clocks":
 * a coarse setInterval timer looks ~120ms ahead and schedules each
 * 16th-note against AudioContext.currentTime, so playback never drifts
 * with main-thread jank.
 */

export type VoiceId = "kick" | "snare" | "hat" | "clap";

export interface VoiceMeta {
  id: VoiceId;
  label: string;
  node: string;
  color: string;
}

export const VOICES: VoiceMeta[] = [
  { id: "kick", label: "KICK", node: "OscillatorNode", color: "#ff6b57" },
  { id: "snare", label: "SNARE", node: "Buffer + HPF", color: "#ffc247" },
  { id: "hat", label: "HI-HAT", node: "Buffer + HPF", color: "#46e0b1" },
  { id: "clap", label: "CLAP", node: "Buffer + BPF", color: "#58a6ff" },
];

export type Pattern = Record<VoiceId, boolean[]>;
export const STEPS = 16;

interface StepEvent {
  step: number;
  time: number;
}

const LOOKAHEAD_S = 0.12;
const TIMER_MS = 25;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private voiceGains = new Map<VoiceId, GainNode>();
  private noiseBuffer: AudioBuffer | null = null;

  private timer: number | null = null;
  private currentStep = 0;
  private nextNoteTime = 0;
  private played: StepEvent[] = [];
  private patternGetter: (() => Pattern) | null = null;

  bpm = 120;
  isPlaying = false;
  muted: Record<VoiceId, boolean> = { kick: false, snare: false, hat: false, clap: false };

  /* ---------------- context & graph ---------------- */

  private ensureCtx(): AudioContext {
    if (this.ctx) return this.ctx;

    // Safari still ships the prefixed constructor (journal entry E-04).
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) throw new Error("Web Audio API unsupported in this browser.");

    const ctx = new Ctor();

    const master = ctx.createGain();
    master.gain.value = 0.9;

    // Compressor acts as a safety ceiling so stacked voices never clip.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 22;
    comp.ratio.value = 6;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.82;

    master.connect(comp);
    comp.connect(analyser);
    analyser.connect(ctx.destination);

    for (const v of VOICES) {
      const g = ctx.createGain();
      g.gain.value = 1;
      g.connect(master);
      this.voiceGains.set(v.id, g);
    }

    // One shared 1s white-noise buffer, sliced by every noise voice.
    const len = ctx.sampleRate;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    this.ctx = ctx;
    this.master = master;
    this.analyser = analyser;
    this.noiseBuffer = buf;
    return ctx;
  }

  /** Must be called from a user gesture — browsers gate audio behind interaction. */
  resume(): void {
    const ctx = this.ensureCtx();
    if (ctx.state === "suspended") void ctx.resume();
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  setMasterVolume(v: number): void {
    const ctx = this.ensureCtx();
    if (this.master) this.master.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
  }

  setBpm(b: number): void {
    this.bpm = Math.min(200, Math.max(50, b));
  }

  /* ---------------- transport ---------------- */

  start(getPattern: () => Pattern): void {
    const ctx = this.ensureCtx();
    if (this.isPlaying) return;
    this.patternGetter = getPattern;
    this.currentStep = 0;
    this.played = [];
    this.nextNoteTime = ctx.currentTime + 0.08;
    this.isPlaying = true;
    this.timer = window.setInterval(() => this.schedule(), TIMER_MS);
    this.schedule();
  }

  stop(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.isPlaying = false;
    this.played = [];
  }

  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || !this.patternGetter) return;

    while (this.nextNoteTime < ctx.currentTime + LOOKAHEAD_S) {
      const step = this.currentStep;
      const pattern = this.patternGetter();
      for (const v of VOICES) {
        if (pattern[v.id][step] && !this.muted[v.id]) this.trigger(v.id, this.nextNoteTime);
      }
      this.played.push({ step, time: this.nextNoteTime });
      if (this.played.length > 8) this.played.shift();

      const secondsPerStep = 60 / this.bpm / 4; // 16th notes
      this.nextNoteTime += secondsPerStep;
      this.currentStep = (this.currentStep + 1) % STEPS;
    }
  }

  /** Column the hardware would light *right now*, derived from the audio clock. */
  getVisualStep(): number {
    if (!this.ctx || !this.isPlaying) return -1;
    const t = this.ctx.currentTime;
    let step = -1;
    for (const e of this.played) if (e.time <= t + 0.004) step = e.step;
    return step;
  }

  /** Fire a single voice immediately (used by audition + tap-tempo buttons). */
  preview(voice: VoiceId): void {
    const ctx = this.ensureCtx();
    if (ctx.state === "suspended") void ctx.resume();
    this.trigger(voice, ctx.currentTime + 0.015);
  }

  /* ---------------- voice synthesis ---------------- */

  private trigger(voice: VoiceId, t: number): void {
    const ctx = this.ctx;
    const out = this.voiceGains.get(voice);
    if (!ctx || !out) return;

    switch (voice) {
      case "kick": {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(152, t);
        osc.frequency.exponentialRampToValueAtTime(41, t + 0.1);
        g.gain.setValueAtTime(1, t);
        // exponential ramps can never reach 0 — decay to 0.0001 (E-05).
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        osc.connect(g);
        g.connect(out);
        osc.start(t);
        osc.stop(t + 0.32);
        break;
      }
      case "snare": {
        const noise = ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const hpf = ctx.createBiquadFilter();
        hpf.type = "highpass";
        hpf.frequency.value = 1550;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.62, t);
        ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
        noise.connect(hpf);
        hpf.connect(ng);
        ng.connect(out);
        noise.start(t);
        noise.stop(t + 0.2);

        const body = ctx.createOscillator();
        body.type = "triangle";
        body.frequency.setValueAtTime(196, t);
        const bg = ctx.createGain();
        bg.gain.setValueAtTime(0.32, t);
        bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        body.connect(bg);
        bg.connect(out);
        body.start(t);
        body.stop(t + 0.1);
        break;
      }
      case "hat": {
        const noise = ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const hpf = ctx.createBiquadFilter();
        hpf.type = "highpass";
        hpf.frequency.value = 7400;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.38, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
        noise.connect(hpf);
        hpf.connect(g);
        g.connect(out);
        noise.start(t);
        noise.stop(t + 0.07);
        break;
      }
      case "clap": {
        const noise = ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const bpf = ctx.createBiquadFilter();
        bpf.type = "bandpass";
        bpf.frequency.value = 1150;
        bpf.Q.value = 1.3;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        // Three rapid retriggers fake the smeared transients of hands clapping.
        for (const o of [0, 0.011, 0.023]) {
          g.gain.setValueAtTime(0.5, t + o);
          g.gain.exponentialRampToValueAtTime(0.07, t + o + 0.012);
        }
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
        noise.connect(bpf);
        bpf.connect(g);
        g.connect(out);
        noise.start(t);
        noise.stop(t + 0.26);
        break;
      }
    }
  }
}

/* Singleton — constructing extra AudioContexts hits the browser's
 * hardware-context limit (journal entry E-06). */
let instance: AudioEngine | null = null;
export function getEngine(): AudioEngine {
  if (!instance) instance = new AudioEngine();
  return instance;
}
