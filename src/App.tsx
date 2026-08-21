import { useState } from "react";
import Sequencer from "./components/Sequencer";
import SignalChain from "./components/SignalChain";
import ScopeDelta from "./components/ScopeDelta";
import Journal from "./components/Journal";
import { useReveal } from "./hooks/useReveal";

const TICKER_ITEMS = [
  "ctx.sampleRate 48000 Hz",
  "lookahead 120 ms",
  "scheduler timer 25 ms",
  "voices 4 · all synthesized",
  "audio samples loaded: 0",
  "nodes per hit: disposable",
  "master bus → compressor → analyser",
  "playhead locked to AudioContext.currentTime",
  "persistence: localStorage",
  "blockers 6 · escalations 0",
  "pivot S-2 absorbed in 34 min",
  "silent mode: performance.now() fallback clock",
  "zero AudioContexts opened while SILENT",
  "patterns portable: JSON export / import",
  "scope shed: swing · chaining · mic = −145 min",
  "regression pass 9/9 after pivot",
];

function Led({ color, label, blink, fast }: { color: string; label: string; blink?: boolean; fast?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`h-2 w-2 rounded-full ${fast ? "led-fast" : blink ? "led-blink" : ""}`}
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span className="font-mono text-[10px] tracking-[0.2em] text-ink-400">{label}</span>
    </span>
  );
}

function SectionTag({ index, label }: { index: string; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="font-mono text-xs text-sig-amber">// {index}</span>
      <span className="h-px flex-1 bg-ink-600/70" />
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400">{label}</span>
    </div>
  );
}

function Learnings() {
  const { ref, on } = useReveal<HTMLDivElement>();
  const items = [
    {
      n: "01",
      title: "The browser has two clocks",
      body: "Date.now() and setInterval serve the UI thread and drift under load; AudioContext.currentTime is the only clock that stays sample-accurate. Every note in PULSE-8 is stamped with the audio clock, and the visual playhead is read back from it — never from a React timer.",
    },
    {
      n: "02",
      title: "Audio nodes are disposable",
      body: "An OscillatorNode can only ever be started once. Instead of reusing nodes, each drum hit constructs a tiny throwaway graph — oscillator, filter, gain envelope — and lets it be garbage-collected into silence. The instrument allocates, plays, forgets.",
    },
    {
      n: "03",
      title: "The page guards its own sound",
      body: "Autoplay policy means an AudioContext wakes up suspended until a human gesture vouches for it. The prototype leans into the constraint: the PLAY button is both transport and permission slip, resuming the context before the first note is scheduled.",
    },
  ];
  return (
    <div ref={ref} className={`reveal ${on ? "on" : ""} mt-12 grid gap-5 lg:grid-cols-3`}>
      {items.map((it, i) => (
        <div
          key={it.n}
          className="group relative rounded-xl border border-ink-600 bg-ink-900/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-ink-400"
          style={{ transitionDelay: `${i * 70}ms` }}
        >
          <span className="font-display text-4xl font-bold text-ink-600 transition-colors group-hover:text-sig-amber/70">
            {it.n}
          </span>
          <h4 className="mt-3 font-display text-lg font-semibold text-ink-100">{it.title}</h4>
          <p className="mt-2 text-sm leading-relaxed text-ink-300">{it.body}</p>
        </div>
      ))}
    </div>
  );
}

function SignalSection() {
  const { ref, on } = useReveal<HTMLDivElement>();
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <div ref={ref} className={`reveal ${on ? "on" : ""}`}>
        <SectionTag index="02" label="Architecture learned" />
        <h2 className="mb-3 font-display text-3xl font-bold text-ink-100 sm:text-4xl">
          The signal path, end to end
        </h2>
        <p className="mb-10 max-w-2xl text-[15px] leading-relaxed text-ink-300">
          Web Audio is a graph, not an API of play() calls. Each drum hit spawns disposable
          generator nodes, shapes them through filters and envelopes, and merges everything onto a
          protected master bus.
        </p>
        <SignalChain />
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-sig-amber/30 bg-sig-amber/5 px-4 py-3">
          <span className="mt-0.5 font-mono text-[10px] font-semibold tracking-[0.2em] text-sig-amber">
            S-2 NOTE
          </span>
          <p className="text-[12.5px] leading-relaxed text-ink-300">
            In <span className="text-sig-amber">SILENT</span> mode this chain is cut at the scheduler: the
            transport advances on the JS clock, <span className="font-mono text-[11px] text-ink-200">trigger()</span> records
            events without building nodes, and the scope renders a pattern-derived trace instead of reading
            the (nonexistent) master bus. No AudioContext is ever constructed.
          </p>
        </div>
        <Learnings />
      </div>
    </section>
  );
}

function Ticker() {
  const content = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="overflow-hidden border-y border-ink-600/70 bg-ink-900/80 py-2.5">
      <div className="ticker-track">
        {content.map((item, i) => (
          <span key={i} className="flex items-center whitespace-nowrap font-mono text-[11px] text-ink-300">
            <span className="px-5">{item}</span>
            <span className="text-sig-amber/70">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="min-h-screen overflow-x-clip">
      {/* ---------- nameplate ---------- */}
      <header className="sticky top-0 z-40 border-b border-ink-600/70 bg-ink-950/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <a href="#instrument" className="flex items-baseline gap-2">
            <span className="font-display text-xl font-bold tracking-[0.08em] text-ink-100">
              PULSE<span className="text-sig-amber">-</span>8
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400 sm:inline">
              Web Audio API field prototype
            </span>
          </a>
          <div className="ml-auto flex items-center gap-4 sm:gap-5">
            <div className="hidden items-center gap-4 md:flex">
              <Led color="#5cd97f" label="PWR" blink />
              <Led color="#ffb03a" label="CLK" fast={playing} />
              <Led color="#4cc9f0" label="SND" fast={playing} />
            </div>
            <span className="rounded border border-ink-600 bg-ink-800 px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] text-ink-200">
              INDIVIDUAL SUBMISSION
            </span>
            <a
              href="#scope-delta"
              title="Scope Delta Analysis — the mid-sprint pivot, documented"
              className="rounded border border-sig-amber/60 bg-sig-amber/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] text-sig-amber transition-colors hover:bg-sig-amber/20"
            >
              PIVOT S-2 · ABSORBED
            </a>
          </div>
        </div>
      </header>

      {/* ---------- 01 · the instrument ---------- */}
      <main>
        <section id="instrument" className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionTag index="01" label="Functional deliverable · 40%" />
              <h1 className="font-display text-3xl font-bold leading-tight text-ink-100 sm:text-5xl">
                A drum machine built from
                <br className="hidden sm:block" />{" "}
                <span className="text-sig-cyan">an API I'd never touched.</span>
              </h1>
            </div>
            <p className="max-w-xs font-mono text-[11px] leading-relaxed text-ink-400">
              Press PLAY. Every sound is synthesized live from oscillators and filtered noise —
              the unfamiliar tool, made audible.
            </p>
          </div>

          <Sequencer onPlayingChange={setPlaying} />

          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-ink-400">
            <kbd className="rounded border border-ink-600 bg-ink-800 px-1.5 py-0.5 text-ink-200">SPACE</kbd>
            play / stop
            <span className="text-ink-600">·</span>
            click cells to program
            <span className="text-ink-600">·</span>
            TAP four beats to set tempo
            <span className="text-ink-600">·</span>
            session auto-saves
            <span className="text-ink-600">·</span>
            flip <span className="text-sig-amber">SILENT</span> for the zero-audio pivot demo
            <span className="text-ink-600">·</span>
            EXPORT / IMPORT patterns as JSON
          </p>
        </section>

        <div className="mt-10">
          <Ticker />
        </div>

        {/* ---------- 02 · signal path ---------- */}
        <SignalSection />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-ink-600 to-transparent" />
        </div>

        {/* ---------- 03 · scope delta analysis ---------- */}
        <div className="pt-16 sm:pt-20">
          <ScopeDelta />
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-ink-600 to-transparent" />
        </div>

        {/* ---------- 04 · journal ---------- */}
        <div className="pt-16 sm:pt-20">
          <Journal />
        </div>
      </main>

      {/* ---------- footer ---------- */}
      <footer className="border-t border-ink-600/70 bg-ink-900/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-8 sm:px-6">
          <span className="font-display text-sm font-bold tracking-[0.08em] text-ink-100">
            PULSE<span className="text-sig-amber">-</span>8
          </span>
          <span className="font-mono text-[11px] text-ink-400">
            prototype + journal (Sprint 1) · pivot S-2 absorbed in 34 min, scope shed −145 min, regression 9/9 (Sprint 2).
          </span>
          <span className="ml-auto flex items-center gap-2 font-mono text-[11px] text-ink-300">
            <span className="h-2 w-2 rounded-full bg-sig-green led-blink shadow-[0_0_8px_rgba(92,217,127,0.8)]" />
            build green · zero console errors
          </span>
        </div>
      </footer>
    </div>
  );
}
