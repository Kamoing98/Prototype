import { AXES, CALIBRATION, HANDLING, INDEX, META, QUOTES, type Indicator } from "../data/adaptability";
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

function EvidenceChip({ id }: { id: string }) {
  return (
    <span className="inline-block rounded border border-ink-600 bg-ink-900 px-1.5 py-0.5 font-mono text-[9.5px] tracking-wider text-sig-cyan/90 transition-colors hover:border-sig-cyan/60 hover:text-sig-cyan">
      {id}
    </span>
  );
}

function IndicatorRow({ ind }: { ind: Indicator }) {
  return (
    <li className="group flex items-start gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-ink-800/60">
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border font-mono text-[11px] font-bold leading-none ${
          ind.sign === 1
            ? "border-sig-green/50 bg-sig-green/10 text-sig-green"
            : "border-sig-amber/50 bg-sig-amber/10 text-sig-amber"
        }`}
      >
        {ind.sign === 1 ? "+" : "−"}
      </span>
      <div className="min-w-0">
        <p className="text-[13px] leading-relaxed text-ink-200">{ind.text}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {ind.evidence.map((e) => (
            <EvidenceChip key={e} id={e} />
          ))}
        </div>
      </div>
    </li>
  );
}

function CompositeDial({ on }: { on: boolean }) {
  const value = useCountUp(INDEX.value, on, 1300);
  const R = 70;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - (on ? INDEX.value : 0) / 100);

  return (
    <div className="relative mx-auto h-[190px] w-[190px]">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
        <circle cx="90" cy="90" r={R} fill="none" stroke="#1d2836" strokeWidth="10" />
        <circle
          cx="90"
          cy="90"
          r={R}
          fill="none"
          stroke="#ffb03a"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)",
            filter: "drop-shadow(0 0 10px rgba(255,176,58,0.45))",
          }}
        />
        {/* tick ring */}
        {Array.from({ length: 40 }, (_, i) => (
          <line
            key={i}
            x1="90"
            y1="6"
            x2="90"
            y2={i % 10 === 0 ? "14" : "10"}
            stroke={i % 10 === 0 ? "#5d7392" : "#2a3950"}
            strokeWidth="1.5"
            transform={`rotate(${i * 9} 90 90)`}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-bold tabular-nums text-ink-100">{value}</span>
        <span className="font-mono text-[10px] tracking-[0.3em] text-ink-400">/ 100</span>
        <span className="mt-1 font-mono text-[10px] text-ink-500">wt. {INDEX.weighted}</span>
      </div>
    </div>
  );
}

export default function AdaptabilityIndex() {
  const { ref, on } = useReveal<HTMLDivElement>(0.08);
  const { ref: qRef, on: qOn } = useReveal<HTMLDivElement>(0.15);

  return (
    <section id="adaptability" className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
      <SectionTag index="05" label="Individual adaptability index · peer review" />

      <div ref={ref} className={`reveal ${on ? "on" : ""} relative`}>
        {/* -------- dossier card -------- */}
        <div className="relative rounded-xl border border-ink-500/80 bg-ink-900/80 shadow-[0_24px_60px_rgba(4,8,14,0.6)]">
          {/* corner crop marks */}
          {["left-0 top-0 border-l-2 border-t-2", "right-0 top-0 border-r-2 border-t-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"].map(
            (pos) => (
              <span key={pos} className={`pointer-events-none absolute h-4 w-4 border-sig-amber/70 ${pos}`} />
            )
          )}

          {/* CONFIDENTIAL stamp */}
          <div className="pointer-events-none absolute -top-4 right-4 z-10 sm:right-10">
            <span
              className={`inline-block rounded border-2 border-kick/80 px-3 py-1 font-display text-sm font-bold tracking-[0.35em] text-kick/90 ${on ? "stamp" : "opacity-0"}`}
              style={{ textShadow: "0 0 12px rgba(255,107,87,0.35)" }}
            >
              CONFIDENTIAL
            </span>
          </div>

          {/* document header strip */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-b border-ink-600/70 px-5 py-5 sm:grid-cols-4 sm:px-8">
            {[
              ["FORM", META.form],
              ["SUBJECT", META.subject],
              ["REVIEWER", META.reviewer],
              ["WINDOW", META.period],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="font-mono text-[9.5px] tracking-[0.28em] text-ink-500">{k}</div>
                <div className="mt-1 font-mono text-[11.5px] leading-snug text-ink-200">{v}</div>
              </div>
            ))}
          </div>

          {/* body: composite + axes */}
          <div className="grid gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[300px_1fr] lg:gap-12">
            {/* composite */}
            <div className="border-ink-600/60 lg:border-r lg:pr-10">
              <div className="font-mono text-[9.5px] tracking-[0.28em] text-ink-500">COMPOSITE INDEX</div>
              <div className="mt-4">
                <CompositeDial on={on} />
              </div>
              <div className="mt-4 text-center">
                <span className="inline-block rounded border border-sig-amber/60 bg-sig-amber/10 px-2.5 py-1 font-display text-[11px] font-bold tracking-[0.25em] text-sig-amber">
                  {INDEX.band}
                </span>
                <p className="mt-2 font-mono text-[10.5px] leading-relaxed text-ink-400">{INDEX.bandNote}</p>
              </div>

              <div className="mt-6 space-y-2">
                {AXES.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-2 font-mono text-[10.5px]">
                    <span className="h-2 w-2 rounded-sm" style={{ background: a.color }} />
                    <span className="tracking-[0.2em] text-ink-300">{a.name}</span>
                    <span className="ml-auto text-ink-500">wt {a.weight}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-2.5 border-t border-ink-600/60 pt-5">
                {HANDLING.map((h) => (
                  <div key={h.label}>
                    <div className="font-mono text-[9px] tracking-[0.28em] text-ink-500">{h.label}</div>
                    <div className="font-mono text-[10.5px] text-ink-300">{h.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* axis form rows */}
            <div>
              {AXES.map((axis, ai) => (
                <div key={axis.id} className={`${ai > 0 ? "mt-8 border-t border-ink-600/60 pt-8" : ""}`}>
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h3 className="font-display text-xl font-bold tracking-[0.12em]" style={{ color: axis.color }}>
                      {axis.name}
                    </h3>
                    <span className="font-mono text-[10px] tracking-[0.2em] text-ink-500">WEIGHT {axis.weight}</span>
                    <span className="ml-auto font-mono text-lg font-semibold tabular-nums text-ink-100">
                      {axis.rating.toFixed(1)}
                      <span className="text-[11px] text-ink-500"> / 5.0</span>
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-400">{axis.blurb}</p>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-700">
                    <div
                      className="h-full rounded-full transition-[width] duration-1000 ease-out"
                      style={{
                        width: on ? `${(axis.rating / 5) * 100}%` : "0%",
                        background: `linear-gradient(90deg, ${axis.color}66, ${axis.color})`,
                        boxShadow: `0 0 10px ${axis.color}88`,
                        transitionDelay: `${200 + ai * 180}ms`,
                      }}
                    />
                  </div>

                  <ul className="mt-4 divide-y divide-ink-700/50">
                    {axis.indicators.map((ind, ii) => (
                      <IndicatorRow key={ii} ind={ind} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* verbatim + calibration */}
          <div ref={qRef} className={`reveal ${qOn ? "on" : ""} border-t border-ink-600/70 px-5 py-8 sm:px-8`}>
            <div className="font-mono text-[9.5px] tracking-[0.28em] text-ink-500">
              PEER VERBATIMS · recorded during pivot window
            </div>
            <div className="mt-5 space-y-4">
              {QUOTES.map((q, i) => (
                <blockquote
                  key={i}
                  className={`border-l-2 py-1 pl-4 transition-all duration-300 hover:translate-x-1 ${
                    i === 0 ? "border-sig-amber/70" : i === 1 ? "border-sig-cyan/70 lg:ml-8" : "border-sig-green/70 lg:ml-16"
                  }`}
                >
                  <p className="text-[13.5px] italic leading-relaxed text-ink-200">“{q}”</p>
                </blockquote>
              ))}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
              <div>
                <div className="font-mono text-[9.5px] tracking-[0.28em] text-ink-500">CALIBRATION NOTE</div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-300">{CALIBRATION.note}</p>
                <p className="mt-3 border-t border-ink-700/60 pt-3 text-[13px] font-medium leading-relaxed text-sig-amber">
                  {CALIBRATION.recommendation}
                </p>
              </div>
              <div className="flex flex-col justify-end gap-1 lg:border-l lg:border-ink-600/60 lg:pl-6">
                <span className="font-mono text-[11px] text-ink-300">— {META.reviewer}</span>
                <span className="font-mono text-[10px] text-ink-500">countersigned · sprint 2 close</span>
                <span className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] text-sig-green">
                  <span className="h-1.5 w-1.5 rounded-full bg-sig-green shadow-[0_0_6px_rgba(92,217,127,0.9)]" />
                  {META.status}
                </span>
              </div>
            </div>
          </div>

          {/* handling strip */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-b-xl border-t border-dashed border-kick/40 bg-kick/5 px-5 py-3 sm:px-8">
            <span className="font-mono text-[9.5px] font-bold tracking-[0.28em] text-kick/90">HANDLING</span>
            {HANDLING.map((h) => (
              <span key={h.label} className="font-mono text-[10px] text-ink-400">
                {h.label}: <span className="text-ink-200">{h.value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
