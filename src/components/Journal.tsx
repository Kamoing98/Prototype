import { useEffect, useState } from "react";
import { ERROR_LOG, RESOURCES, STATS, TIMELINE, type ErrorEntry } from "../data/journal";
import { useCountUp, useReveal } from "../hooks/useReveal";

function SectionTag({ index, label }: { index: string; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="font-mono text-xs text-sig-amber">// {index}</span>
      <span className="h-px flex-1 bg-ink-600/70" />
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400">{label}</span>
    </div>
  );
}

/* ---------------- resources ---------------- */

function Resources() {
  const { ref, on } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal ${on ? "on" : ""}`}>
      <SectionTag index="03-A" label="Resources consulted" />
      <h3 className="mb-6 font-display text-2xl font-semibold text-ink-100 sm:text-3xl">
        Where the knowledge came from
      </h3>
      <div className="overflow-hidden rounded-xl border border-ink-600 bg-ink-900/70">
        {RESOURCES.map((r, i) => (
          <div
            key={r.id}
            className={`group grid gap-x-6 gap-y-2 px-5 py-4 transition-colors hover:bg-ink-800/70 sm:grid-cols-[4.5rem_1fr] sm:px-6 ${
              i > 0 ? "border-t border-ink-600/60" : ""
            }`}
          >
            <span className="font-mono text-sm font-semibold text-sig-cyan">{r.id}</span>
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h4 className="font-display text-base font-semibold text-ink-100">{r.title}</h4>
                <span className="font-mono text-[11px] text-ink-400">{r.source}</span>
              </div>
              <span className="mt-0.5 inline-block font-mono text-[11px] text-sig-amber/80 underline decoration-sig-amber/30 underline-offset-4 transition-colors group-hover:text-sig-amber">
                {r.url}
              </span>
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-ink-300">{r.extracted}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- error log ---------------- */

function LogEntry({ entry, open, onToggle }: { entry: ErrorEntry; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-ink-700/80 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-800/60 sm:px-5"
        aria-expanded={open}
      >
        <span className="font-mono text-[11px] text-ink-400">{entry.time}</span>
        <span className="rounded bg-kick/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-kick">
          {entry.id}
        </span>
        <span className="font-mono text-[13px] font-semibold text-ink-100">{entry.name}</span>
        <svg
          viewBox="0 0 24 24"
          className={`ml-auto h-4 w-4 shrink-0 text-ink-400 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 px-4 pb-4 sm:px-5">
            <p className="rounded border border-kick/30 bg-kick/8 px-3 py-2 font-mono text-[12px] leading-relaxed text-kick/90">
              ✕ {entry.message}
            </p>
            <div>
              <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-sig-amber">
                DIAGNOSIS →
              </span>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-200">{entry.diagnosis}</p>
            </div>
            <div>
              <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-sig-green">
                FIX →
              </span>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-200">{entry.fix}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorLog() {
  const { ref, on } = useReveal<HTMLDivElement>();
  const [openId, setOpenId] = useState<string | null>("E-01");
  return (
    <div ref={ref} className={`reveal ${on ? "on" : ""}`}>
      <SectionTag index="03-B" label="Error log · 6 entries · 6 resolved" />
      <h3 className="mb-6 font-display text-2xl font-semibold text-ink-100 sm:text-3xl">
        Everything that broke, and how
      </h3>
      <div className="overflow-hidden rounded-xl border border-ink-600 bg-ink-950/90 shadow-[0_22px_48px_rgba(4,8,14,0.5)]">
        {/* terminal chrome */}
        <div className="flex items-center gap-2 border-b border-ink-700 bg-ink-900 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-kick/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-sig-amber/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-sig-green/80" />
          <span className="ml-3 font-mono text-[11px] text-ink-400">
            pulse8 — blocker-journal.log
          </span>
          <span className="ml-auto font-mono text-[10px] text-sig-green">exit 0</span>
        </div>
        <div className="term-scroll max-h-[430px] overflow-y-auto">
          {ERROR_LOG.map((e) => (
            <LogEntry
              key={e.id}
              entry={e}
              open={openId === e.id}
              onToggle={() => setOpenId((cur) => (cur === e.id ? null : e.id))}
            />
          ))}
        </div>
      </div>
      <p className="mt-3 font-mono text-[11px] text-ink-400">
        Click any entry to expand the full diagnosis. No entry required supervisor input.
      </p>
    </div>
  );
}

/* ---------------- timeline ---------------- */

function Timeline() {
  const { ref, on } = useReveal<HTMLDivElement>();
  const dot = (kind: string) =>
    kind === "blocker"
      ? "border-kick bg-kick/20 shadow-[0_0_10px_rgba(255,107,87,0.5)]"
      : kind === "win"
        ? "border-sig-green bg-sig-green/20 shadow-[0_0_10px_rgba(92,217,127,0.5)]"
        : "border-sig-cyan bg-sig-cyan/20 shadow-[0_0_10px_rgba(76,201,240,0.4)]";
  return (
    <div ref={ref} className={`reveal ${on ? "on" : ""}`}>
      <SectionTag index="03-C" label="Troubleshooting timeline" />
      <h3 className="mb-8 font-display text-2xl font-semibold text-ink-100 sm:text-3xl">
        3h 20m, minute by minute
      </h3>
      <ol className="relative ml-2 space-y-7 border-l border-ink-600 pl-7 sm:ml-4">
        {TIMELINE.map((t) => (
          <li key={t.time} className="group relative">
            <span
              className={`absolute -left-[35px] top-1 h-3.5 w-3.5 rounded-full border-2 transition-transform group-hover:scale-125 sm:-left-[37px] ${dot(t.kind)}`}
            />
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono text-xs font-semibold text-sig-amber">{t.time}</span>
              <h4 className="font-display text-base font-semibold text-ink-100">{t.title}</h4>
              {t.duration && (
                <span className="rounded-full border border-kick/40 bg-kick/10 px-2 py-0.5 font-mono text-[10px] text-kick">
                  resolved in {t.duration}
                </span>
              )}
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-300">{t.detail}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------------- stats ---------------- */

function StatCard({ value, suffix, label, note, active, delay }: {
  value: number; suffix: string; label: string; note: string; active: boolean; delay: number;
}) {
  const n = useCountUp(value, active);
  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-ink-600 bg-ink-900/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-sig-amber/60"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-sig-amber/10 blur-xl transition-opacity opacity-0 group-hover:opacity-100" />
      <div className="font-mono text-3xl font-semibold tabular-nums text-sig-amber sm:text-4xl">
        {n}
        <span className="text-lg text-ink-300">{suffix}</span>
      </div>
      <div className="mt-2 font-display text-[13px] font-semibold tracking-wide text-ink-100">{label}</div>
      <div className="mt-1 font-mono text-[11px] leading-relaxed text-ink-400">{note}</div>
    </div>
  );
}

function Stats() {
  const { ref, on } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal ${on ? "on" : ""}`}>
      <SectionTag index="03-D" label="Resource efficiency readout" />
      <h3 className="mb-6 font-display text-2xl font-semibold text-ink-100 sm:text-3xl">
        Efficiency, measured
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STATS.map((s, i) => (
          <StatCard key={s.label} {...s} active={on} delay={i * 60} />
        ))}
      </div>
    </div>
  );
}

/* ---------------- export ---------------- */

export default function Journal() {
  const [tick, setTick] = useState(false);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => !t), 1100);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <div className="mb-12">
        <SectionTag index="03" label="Documentation deliverable" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-bold leading-tight text-ink-100 sm:text-5xl">
            Learning &amp; Blocker <span className="text-sig-amber">Journal</span>
          </h2>
          <span className="flex items-center gap-2 rounded-full border border-ink-600 bg-ink-900 px-4 py-2 font-mono text-[11px] text-ink-300">
            <span className={`h-2 w-2 rounded-full bg-sig-green ${tick ? "opacity-100" : "opacity-30"} transition-opacity`} />
            recorded live during the build
          </span>
        </div>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-300">
          The brief asked for an unfamiliar tool learned without direct supervision. This is the
          paper trail: every resource that shaped the architecture, every error the prototype
          threw, and the exact path from red stack trace to green build.
        </p>
      </div>

      <div className="space-y-16 sm:space-y-20">
        <Resources />
        <ErrorLog />
        <Timeline />
        <Stats />
      </div>
    </section>
  );
}
