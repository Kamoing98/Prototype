# PULSE-8 — Unfamiliar-Tool Prototype Submission

**Type:** Individual submission
**Unfamiliar tool/concept:** The [Web Audio API](https://developer.mozilla.org/docs/Web/API/Web_Audio_API) — programmatic, real-time audio synthesis and scheduling in the browser.

A working mini-prototype (a 16-step, 4-voice drum sequencer, 100% synthesized — zero audio samples) shipped together with a **Learning & Blocker Journal** covering resources consulted, error logs, and how every blocker was resolved without direct supervision. The journal is embedded in the app itself; a condensed version lives below.

---

## What was built

**PULSE-8** — a hardware-style step sequencer rendered in code:

- **16-step × 4-voice grid** (kick / snare / hi-hat / clap), each voice synthesized live from oscillators and filtered white-noise buffers.
- **Lookahead scheduler** — a coarse 25 ms timer schedules notes ~120 ms ahead against `AudioContext.currentTime` (the "A Tale of Two Clocks" pattern), so playback stays sample-accurate regardless of main-thread jank.
- **Transport & controls** — play/stop, BPM slider (50–200) with live tap tempo, master volume, per-voice mute + audition, three pattern presets, grid clear.
- **Live oscilloscope** — real-time waveform via `AnalyserNode`, plus a playhead driven by the audio clock (not the UI timer).
- **Persistence** — pattern and BPM survive reload via `localStorage`.
- **Journal site sections** — signal-path diagram, resources ledger, expandable terminal error log, blocker timeline, and measured time/efficiency stats.

## Run it

```bash
npm install
npm run dev        # local development
npm run build      # production build → dist/
```

## Take it live (get a shareable URL)

The build is fully static — everything the page needs lands in `dist/`, so any static host works. Fastest options, no config required:

| Host | Steps | Link you get |
|---|---|---|
| **Netlify Drop** | `npm run build`, then drag the `dist/` folder onto [app.netlify.com/drop](https://app.netlify.com/drop) | `https://<random>.netlify.app` instantly |
| **Vercel** | `npx vercel` (accepts defaults; framework detected as Vite) | `https://pulse-8-*.vercel.app` |
| **Cloudflare Pages** | `npm run build`, upload `dist/` via the dashboard, or connect the repo with build command `npm run build` and output `dist` | `https://*.pages.dev` |
| **GitHub Pages** | Push the repo, set Pages source to a `dist/` build (or add the `gh-pages` branch via `npx gh-pages -d dist`) | `https://<user>.github.io/<repo>` |

> No backend, no env vars, no build-time network calls — the deployed build behaves identically to the local one, audio included (autoplay still requires the first user click, by browser policy).

## Project structure

```
src/
├── audio/
│   ├── engine.ts       # AudioContext singleton, graph, lookahead scheduler, voice synthesis
│   └── patterns.ts     # 16-step pattern model + presets
├── components/
│   ├── Sequencer.tsx   # machine panel: transport, BPM/tap, voice rows, grid, presets
│   ├── Visualizer.tsx  # AnalyserNode oscilloscope canvas
│   ├── SignalChain.tsx # animated graph diagram (JS timer → audio clock → graph → DAC)
│   └── Journal.tsx     # resources, error log, timeline, stats
├── data/journal.ts     # all journal content (resources, errors, timeline, stats)
├── hooks/useReveal.ts  # scroll-reveal + count-up hooks
├── App.tsx
└── index.css           # design tokens, panel/LED/scanline styles, keyframes
```

## Evaluation criteria → where it's demonstrated

| Criterion | Evidence |
|---|---|
| **Functional correctness (40%)** | Working prototype at the top of the page: transport, grid editing, presets, live audio, scope, persistence — try it, then reload to confirm the pattern survives. |
| **Troubleshooting autonomy & documentation (40%)** | Journal section: 6 referenced resources with what was extracted from each, 6 real error entries (console output → diagnosis → fix), and a timeline showing each blocker resolved solo with time-to-resolution. |
| **Resource efficiency / time-to-completion (20%)** | Stats strip: 3h20 total, first audible output in 12 min, 6/6 blockers self-resolved, zero escalations. |

### Pivot rubric (post S-2)

| Criterion | Evidence |
|---|---|
| **Adaptation completeness (40%)** | SILENT toggle (zero-audio, no `AudioContext`), pattern-derived synthetic scope, JSON export + validated import — all live in the instrument. |
| **Architectural / deliverable integrity (30%)** | 9/9 regression matrix in the SDA section; audible code path unchanged, old persistence payloads still load. |
| **Trade-off documentation & backlog refactoring (30%)** | `SDA-01` section: dropped/modified/added ledgers with rationale and effort, before/after backlog board, net −111 min schedule accounting. |

## Learning & Blocker Journal (condensed)

### Resources consulted
1. *A Tale of Two Clocks: Scheduling Web Audio with Precision* — web.dev (the lookahead scheduler pattern)
2. *Using the Web Audio API* — MDN (audio-graph mental model)
3. *Autoplay policy* — MDN / Chrome Platform Status (gesture-gated `resume()`)
4. *Web Audio API Basics* — webaudioapi.com (drum synthesis recipes)
5. *AudioParam reference* — MDN (exponential-ramp fine print)
6. *webkitAudioContext compatibility* — caniuse.com (Safari prefix fallback)

### Error log highlights
- **E-01 `NotAllowedError`** — context created before user gesture; fixed by lazy construction + `resume()` inside the PLAY handler.
- **E-02 `InvalidStateError`** — restarted a used `OscillatorNode`; fixed by treating nodes as disposable (new nodes per trigger).
- **E-03 timing drift** — `Date.now()`-based scheduling; replaced with the `AudioContext.currentTime` lookahead scheduler.
- **E-04 `TypeError` (Safari)** — missing `window.AudioContext`; fixed with a `webkitAudioContext` fallback.
- **E-05 click artifacts** — `exponentialRampToValueAtTime(0, …)` can't reach 0; ramp to `0.0001` and stop just after.
- **E-06 StrictMode double-fire** — orphaned interval; fixed with a singleton engine, idempotent `start()`, and effect cleanup.

### Efficiency
Total: **3h 20m**, solo, unsupervised — first sound at T+12 min, every blocker resolved from documentation and debugging alone.

## Mid-sprint pivot (Scope Delta Analysis — `SDA-01`)

Partway through the sprint a new directive landed (**S-2**): *the demo venue cannot emit audio and reviewers are remote — the prototype must work in complete silence and patterns must be shareable as files. Deadline unchanged.*

The full analysis is rendered in-app (section 03). Summary:

**Added (34 min)**
- `SIL-01` — SILENT toggle: zero-audio mode that never opens an `AudioContext`. The transport runs on a `performance.now()` clock; `trigger()` records events without building nodes.
- `EXP-01` — pattern export to a versioned JSON file.
- `IMP-01` — inline import with per-field validation (4 voices × 16 booleans, BPM clamp) and precise error messages.

**Modified (4 reworks)**
- Transport: single audio-clock scheduler → dual-clock (audio ⇄ JS), with safe mid-playback domain switching.
- Oscilloscope: analyser-only → dual-mode; silent mode renders a deterministic pattern-derived trace, clearly labelled synthetic.
- Audition/preview: sonic no-ops in silent mode (grid flash remains as feedback).
- Persistence schema: additive `silent` flag; old payloads still load.

**Dropped (−145 min of stretch scope, deliberately)**
- `SWING-01` swing/shuffle → moved to S3 backlog.
- `CHAIN-01` pattern chaining/song mode → moved to S3 backlog.
- `MIC-01` record-from-microphone → WON'T-DO (conflicts with the silent-venue constraint).

**Integrity (did the pivot break anything?)** — 9/9 regression checks PASS: transport, grid, presets, tempo, volume/mute, live scope, persistence, scheduler accuracy, and all documentation sections verified post-pivot. Net schedule impact: **−111 min**; final ship T+3:54, inside the unchanged deadline.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS 4 — plus the Web Audio API itself (no audio libraries, by design).
