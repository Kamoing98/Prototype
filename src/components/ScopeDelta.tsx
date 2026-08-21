import { useReveal } from "../hooks/useReveal";
import {
  PIVOT_META,
  DROPPED,
  MODIFIED,
  ADDED,
  REGRESSION,
  BACKLOG,
  EFFORT,
  type DeltaItem,
  type BacklogRow,
} from "../data/scopeDelta";

function Ledger({
  title,
  accent,
  tag,
  items,
}: {
  title: string;
  accent: string;
  tag: string;
  items: DeltaItem[];
}) {
  return (
    <div className="flex flex-col rounded-lg border border-ink-600/80 bg-ink-900/70 transition-colors hover:border-ink-400">
      <div className="flex items-center justify-between border-b border-ink-600/60 px-4 py-3">
        <span className="font-display text-sm font-bold tracking-[0.22em]" style={{ color: accent }}>
          {title}
        </span>
        <span
          className="rounded border px-2 py-0.5 font-mono text-[10px] tracking-wider"
          style={{ color: accent, borderColor: `${accent}55`, background: `${accent}14` }}
        >
          {tag}
        </span>
      </div>
      <div className="flex-1 space-y-4 p-4">
        {items.map((it) => (
          <div key={it.id} className="group">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[10px] text-ink-500 transition-colors group-hover:text-ink-300">
                {it.id}
              </span>
              <span className="font-display text-[13px] font-semibold text-ink-100">{it.name}</span>
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-300">{it.detail}</p>
            <p className="mt-1.5 border-l-2 pl-2 font-mono text-[10.5px] leading-relaxed text-ink-400" style={{ borderColor: `${accent}66` }}>
              {it.impact}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function statusChip(row: BacklogRow) {
  const map = {
    DONE: { color: "#5cd97f", label: "DONE" },
    MOVED: { color: "#ffb03a", label: "MOVED → S3" },
    "WONT-DO": { color: "#8598b0", label: "WON'T-DO" },
  } as const;
  const s = map[row.status];
  return (
    <span
      className="rounded border px-2 py-0.5 font-mono text-[10px] tracking-wider"
      style={{ color: s.color, borderColor: `${s.color}55`, background: `${s.color}12` }}
    >
      {s.label}
    </span>
  );
}

export default function ScopeDelta() {
  const head = useReveal<HTMLDivElement>();
  const ledgers = useReveal<HTMLDivElement>();
  const regression = useReveal<HTMLDivElement>();
  const backlog = useReveal<HTMLDivElement>();

  return (
    <section id="scope-delta" className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* ---- document header ---- */}
      <div ref={head.ref} className={`reveal ${head.on ? "on" : ""}`}>
        <div className="mb-3 flex items-center gap-3">
          <span className="font-mono text-xs text-sig-amber">// 03</span>
          <span className="h-px flex-1 bg-ink-600/70" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400">
            Pivot documentation · 30%
          </span>
        </div>

        <div className="panel scan rounded-xl p-5 sm:p-7">
          <div className="screw absolute left-2.5 top-2.5" />
          <div className="screw absolute right-2.5 top-2.5" />

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded border border-sig-amber/60 bg-sig-amber/10 px-2.5 py-1 font-mono text-xs font-semibold tracking-[0.2em] text-sig-amber">
                  {PIVOT_META.docId}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-400">
                  rev. A · filed by author, unsupervised
                </span>
              </div>
              <h2 className="mt-3 font-display text-3xl font-bold text-ink-100 sm:text-4xl">
                {PIVOT_META.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-300">
                Mid-sprint directive S-2 arrived after the journal was drafted and before ship.
                This document records exactly what changed in scope to absorb it — and proves the
                original deliverable survived intact.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-2 font-mono text-[11px] sm:grid-cols-2">
              <div>
                <dt className="text-ink-500">DIRECTIVE RECEIVED</dt>
                <dd className="text-ink-100">{PIVOT_META.received}</dd>
              </div>
              <div>
                <dt className="text-ink-500">ENGINEERING COST</dt>
                <dd className="text-ink-100">{PIVOT_META.absorbed}</dd>
              </div>
              <div>
                <dt className="text-ink-500">FINAL SHIP</dt>
                <dd className="text-sig-green">{PIVOT_META.finalShip}</dd>
              </div>
              <div>
                <dt className="text-ink-500">DEADLINE</dt>
                <dd className="text-ink-100">UNCHANGED ✓</dd>
              </div>
            </dl>
          </div>

          <blockquote className="mt-6 border-l-2 border-sig-amber bg-ink-950/60 px-4 py-3.5 font-mono text-[12px] leading-relaxed text-ink-200">
            <span className="mr-2 text-sig-amber">S-2 ▸</span>
            {PIVOT_META.directive}
          </blockquote>
          <p className="mt-4 max-w-3xl text-[13px] leading-relaxed text-ink-300">
            <span className="font-semibold text-sig-cyan">Interpretation — </span>
            {PIVOT_META.interpretation}
          </p>
        </div>
      </div>

      {/* ---- delta ledgers ---- */}
      <div ref={ledgers.ref} className={`reveal ${ledgers.on ? "on" : ""} mt-8 grid gap-4 lg:grid-cols-3`}>
        <Ledger title="DROPPED" accent="#ff6b57" tag="−145 min" items={DROPPED} />
        <Ledger title="MODIFIED" accent="#ffb03a" tag="4 REWORKS" items={MODIFIED} />
        <Ledger title="ADDED" accent="#5cd97f" tag="+34 min" items={ADDED} />
      </div>

      {/* ---- regression matrix ---- */}
      <div ref={regression.ref} className={`reveal ${regression.on ? "on" : ""} mt-10`}>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-xl font-bold text-ink-100 sm:text-2xl">
            Integrity check — did the pivot break anything?
          </h3>
          <span className="font-mono text-[11px] tracking-wider text-sig-green">
            {REGRESSION.length}/{REGRESSION.length} VERIFIED POST-PIVOT
          </span>
        </div>
        <div className="overflow-hidden rounded-lg border border-ink-600/80">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-ink-600 bg-ink-800/80 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
                <th className="px-4 py-2.5 font-medium">Pre-pivot feature</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Verification evidence</th>
                <th className="px-4 py-2.5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {REGRESSION.map((row, i) => (
                <tr
                  key={row.feature}
                  className={`border-b border-ink-700/60 text-[12.5px] transition-colors last:border-0 hover:bg-ink-800/50 ${
                    i % 2 ? "bg-ink-900/40" : "bg-ink-900/80"
                  }`}
                >
                  <td className="px-4 py-2.5 font-medium text-ink-100">{row.feature}</td>
                  <td className="hidden px-4 py-2.5 text-ink-300 sm:table-cell">{row.evidence}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="inline-flex items-center gap-1.5 rounded border border-sig-green/50 bg-sig-green/10 px-2 py-0.5 font-mono text-[10px] tracking-wider text-sig-green">
                      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-current" aria-hidden>
                        <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                      </svg>
                      PASS
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- backlog refactor ---- */}
      <div ref={backlog.ref} className={`reveal ${backlog.on ? "on" : ""} mt-10`}>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-xl font-bold text-ink-100 sm:text-2xl">
            Backlog refactoring — before / after the directive
          </h3>
          <span className="font-mono text-[11px] tracking-wider text-ink-400">
            6 DONE · 2 MOVED · 1 REMOVED
          </span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-ink-600/80">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink-600 bg-ink-800/80 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
                <th className="px-4 py-2.5 font-medium">ID</th>
                <th className="px-4 py-2.5 font-medium">Item</th>
                <th className="px-4 py-2.5 font-medium">Before S-2</th>
                <th className="px-4 py-2.5 font-medium">After S-2</th>
                <th className="px-4 py-2.5 text-right font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {BACKLOG.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-ink-700/60 text-[12.5px] transition-colors last:border-0 hover:bg-ink-800/50 ${
                    i % 2 ? "bg-ink-900/40" : "bg-ink-900/80"
                  }`}
                >
                  <td className="px-4 py-2.5 font-mono text-[11px] text-ink-400">{row.id}</td>
                  <td className={`px-4 py-2.5 font-medium text-ink-100 ${row.status === "WONT-DO" ? "text-ink-400 line-through decoration-ink-500" : ""}`}>
                    {row.name}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-ink-300">{row.before}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-ink-300">{row.after}</td>
                  <td className="px-4 py-2.5 text-right">{statusChip(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* effort accounting */}
        <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg border border-ink-600/80 bg-ink-900/70 px-5 py-4">
          <div>
            <div className="font-mono text-2xl font-semibold text-sig-amber">+{EFFORT.addedMin} min</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">pivot work added</div>
          </div>
          <div className="hidden h-8 w-px bg-ink-600 sm:block" />
          <div>
            <div className="font-mono text-2xl font-semibold text-kick">−{EFFORT.shedMin} min</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">stretch scope shed</div>
          </div>
          <div className="hidden h-8 w-px bg-ink-600 sm:block" />
          <div>
            <div className="font-mono text-2xl font-semibold text-sig-green">−111 min</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">net schedule impact</div>
          </div>
          <p className="w-full max-w-2xl text-[12.5px] leading-relaxed text-ink-300 lg:ml-auto lg:w-auto lg:max-w-sm">
            {EFFORT.note}
          </p>
        </div>
      </div>
    </section>
  );
}
