const NODES = [
  { name: "OscillatorNode", sub: "per-voice generators", accent: "#ff6b57" },
  { name: "BiquadFilterNode", sub: "HPF / BPF voice shaping", accent: "#46e0b1" },
  { name: "GainNode ×4", sub: "envelopes + mute", accent: "#ffc247" },
  { name: "DynamicsCompressor", sub: "clipping safety ceiling", accent: "#58a6ff" },
  { name: "AnalyserNode", sub: "feeds the oscilloscope", accent: "#4cc9f0" },
  { name: "AudioDestination", sub: "your speakers", accent: "#5cd97f" },
];

export default function SignalChain() {
  return (
    <div className="flex flex-wrap items-stretch gap-y-4">
      {NODES.map((n, i) => (
        <div key={n.name} className="flex items-center">
          <div
            className="group relative rounded-lg border border-ink-600 bg-ink-800/80 px-4 py-3 transition-all duration-200 hover:-translate-y-1 hover:border-ink-400 hover:shadow-[0_10px_28px_rgba(4,8,14,0.5)]"
            style={{ borderTopColor: n.accent, borderTopWidth: 2 }}
          >
            <div className="font-mono text-xs font-semibold text-ink-100 sm:text-[13px]">
              {n.name}
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-ink-400">{n.sub}</div>
            <span
              className="absolute -top-1 right-3 h-2 w-2 rounded-full opacity-70 transition-opacity group-hover:opacity-100"
              style={{ background: n.accent, boxShadow: `0 0 8px ${n.accent}` }}
            />
          </div>
          {i < NODES.length - 1 && (
            <div className="dashflow mx-1 h-[2px] w-6 shrink-0 text-ink-400 sm:mx-2 sm:w-10" aria-hidden />
          )}
        </div>
      ))}
    </div>
  );
}
