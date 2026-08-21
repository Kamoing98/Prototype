export interface Resource {
  id: string;
  title: string;
  source: string;
  url: string;
  extracted: string;
}

export const RESOURCES: Resource[] = [
  {
    id: "R-01",
    title: "A Tale of Two Clocks: Scheduling Web Audio with Precision",
    source: "web.dev · Chris Wilson",
    url: "web.dev/articles/audio-scheduling",
    extracted:
      "The core pattern of this prototype: never trust setInterval for note timing. Run a 25ms timer that schedules notes ~120ms ahead against AudioContext.currentTime. This became the scheduler in engine.ts.",
  },
  {
    id: "R-02",
    title: "Using the Web Audio API + AudioContext reference",
    source: "MDN Web Docs",
    url: "developer.mozilla.org/docs/Web/API/Web_Audio_API",
    extracted:
      "Mental model of the audio graph: nodes are wired source → processing → destination, everything is pull-based off a single hardware clock, and nodes are fire-and-forget.",
  },
  {
    id: "R-03",
    title: "Autoplay policy for media and Web Audio",
    source: "MDN / Chrome Platform Status",
    url: "developer.mozilla.org/docs/Web/API/AudioContext/resume",
    extracted:
      "Why my context opened in the 'suspended' state and how to recover: construct/resume the AudioContext inside a user gesture handler. Shaped the resume() call behind the PLAY button.",
  },
  {
    id: "R-04",
    title: "Web Audio API Basics — synthesis chapters",
    source: "webaudioapi.com · Boris Smus (free online book)",
    url: "webaudioapi.com/book",
    extracted:
      "Recipes for subtractive drum synthesis: pitch-swept sine for kicks, high-passed white noise for hats/snares, band-passed noise bursts for claps. No samples needed.",
  },
  {
    id: "R-05",
    title: "OscillatorNode / AudioParam.exponentialRampToValueAtTime references",
    source: "MDN Web Docs",
    url: "developer.mozilla.org/docs/Web/API/AudioParam",
    extracted:
      "Fine print on envelopes: exponential ramps can never reach 0 (ramp to 0.0001 instead), and param automation is sample-accurate — the source of both a bug and its fix.",
  },
  {
    id: "R-06",
    title: "webkitAudioContext compatibility notes",
    source: "caniuse.com + MDN Browser Compatibility Data",
    url: "caniuse.com/audio-api",
    extracted:
      "Safari still requires the prefixed constructor. A one-line fallback in ensureCtx() keeps the prototype cross-browser.",
  },
];

export interface ErrorEntry {
  id: string;
  time: string;
  name: string;
  message: string;
  diagnosis: string;
  fix: string;
}

export const ERROR_LOG: ErrorEntry[] = [
  {
    id: "E-01",
    time: "T+00:47",
    name: "NotAllowedError",
    message:
      "The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.",
    diagnosis:
      "Context was constructed at module load, before any interaction — browser autoplay policy keeps it in the 'suspended' state, so every schedule call was silently queued into silence.",
    fix: "Lazy-construct the context and call ctx.resume() inside the PLAY pointer handler. Verified state transitions suspended → running in devtools.",
  },
  {
    id: "E-02",
    time: "T+01:12",
    name: "InvalidStateError",
    message: "Failed to execute 'start' on 'OscillatorNode': cannot start more than once.",
    diagnosis:
      "I was caching one OscillatorNode per voice and calling start() again on every hit. Audio nodes are single-use: a started oscillator can never be restarted.",
    fix: "Treat nodes as disposable — build a fresh oscillator/gain pair inside every trigger() call and let garbage collection reclaim them after stop().",
  },
  {
    id: "E-03",
    time: "T+01:38",
    name: "Timing drift (observed)",
    message:
      "Hi-hats wandered off the grid above ~140 BPM; gaps of ±30ms audible against a metronome reference.",
    diagnosis:
      "setInterval is throttled by main-thread work and tab visibility — it's a wake-up call, not a clock. I was deriving note times from Date.now() deltas, inheriting all of that jitter.",
    fix: "Rebuilt around the lookahead scheduler (R-01): notes are stamped with ctx.currentTime up to 120ms ahead. The interval only decides *when* to schedule, never *what time* a note plays.",
  },
  {
    id: "E-04",
    time: "T+02:05",
    name: "TypeError",
    message: "window.AudioContext is not a constructor  (Safari 16)",
    diagnosis:
      "Tested on Safari via a teammate's laptop — older WebKit only exposes the prefixed webkitAudioContext global, so my constructor reference was undefined.",
    fix: "Feature-detect with `window.AudioContext ?? window.webkitAudioContext` in ensureCtx(), and keep the code path on standard node names, which the prefix build already supports.",
  },
  {
    id: "E-05",
    time: "T+02:31",
    name: "Audible artifact",
    message: "Sharp click at the end of every kick — no error thrown, heard before seen.",
    diagnosis:
      "The envelope used exponentialRampToValueAtTime(0, …). Exponential ramps asymptotically approach zero and can't reach it; the engine clamps oddly and the gain snaps at stop().",
    fix: "Ramp to 0.0001 instead of 0, and schedule osc.stop() ~20ms after the envelope floor so the cutoff happens in true silence.",
  },
  {
    id: "E-06",
    time: "T+02:54",
    name: "Zombie scheduler (React StrictMode)",
    message:
      "Every pattern triggered twice at double tempo in dev; a second interval survived unmount.",
    diagnosis:
      "React 18 StrictMode mounts effects twice. My start() interval lived outside the effect cleanup, so the first mount's scheduler kept running alongside the second.",
    fix: "Made the engine a module singleton, made start() idempotent (early-return while playing), and disposed the interval in the effect's cleanup function.",
  },
];

export interface TimelineItem {
  time: string;
  title: string;
  detail: string;
  kind: "work" | "blocker" | "win";
  duration?: string;
}

export const TIMELINE: TimelineItem[] = [
  {
    time: "T+00:00",
    title: "Kickoff — scope locked",
    detail:
      "Goal: a 16-step / 4-voice drum sequencer, 100% synthesized, with a lookahead scheduler and a live scope. No samples, no audio libraries.",
    kind: "work",
  },
  {
    time: "T+00:12",
    title: "First sound",
    detail: "A single oscillator hums through a gain envelope. Graph wiring (source → gain → destination) confirmed working.",
    kind: "win",
  },
  {
    time: "T+00:47",
    title: "Blocker — autoplay policy",
    detail: "Silence on every click. Traced to suspended AudioContext via console warnings; resolved with gesture-gated resume (E-01).",
    kind: "blocker",
    duration: "18 min",
  },
  {
    time: "T+01:38",
    title: "Blocker — tempo drift",
    detail: "Pattern smears above 140 BPM. Researched scheduling models, adopted the lookahead pattern from R-01 (E-03).",
    kind: "blocker",
    duration: "32 min",
  },
  {
    time: "T+02:05",
    title: "Blocker — Safari constructor",
    detail: "Caught during cross-browser check; fixed with a one-line prefix fallback (E-04).",
    kind: "blocker",
    duration: "6 min",
  },
  {
    time: "T+02:54",
    title: "Blocker — StrictMode double-fire",
    detail: "Dev-only double tempo. Fixed with singleton engine + idempotent start + effect cleanup (E-06).",
    kind: "blocker",
    duration: "9 min",
  },
  {
    time: "T+03:20",
    title: "Submission-ready",
    detail: "Presets, tap tempo, mute/audition, localStorage persistence, oscilloscope and this journal complete. Full pass: no console errors.",
    kind: "win",
  },
];

export interface Stat {
  value: number;
  suffix: string;
  label: string;
  note: string;
}

export const STATS: Stat[] = [
  { value: 200, suffix: " min", label: "Total time-to-completion", note: "3h 20m, solo, unsupervised" },
  { value: 12, suffix: " min", label: "To first audible output", note: "oscillator → gain → speakers" },
  { value: 6, suffix: "/6", label: "Blockers self-resolved", note: "zero escalations to a supervisor" },
  { value: 6, suffix: " docs", label: "References consulted", note: "MDN, web.dev, caniuse, 1 book" },
  { value: 120, suffix: " ms", label: "Scheduler lookahead", note: "25ms timer · drift-free at any BPM" },
];
