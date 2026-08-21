import { useEffect, useRef } from "react";
import type { Pattern } from "../audio/engine";
import { VOICES } from "../audio/engine";

interface EngineHandle {
  getAnalyser(): AnalyserNode | null;
  getVisualPhase(): number;
}

interface Props {
  engine: EngineHandle;
  playing: boolean;
  /** Pivot S-2: in silent mode there is no audio bus, so the scope renders a
   *  deterministic waveform synthesized from the pattern itself. */
  silent: boolean;
  pattern: Pattern;
}

/** Deterministic pseudo-noise so the synthetic trace is stable frame to frame. */
const rnd = (x: number) => {
  const s = Math.sin(x * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

export default function Visualizer({ engine, playing, silent, pattern }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const patternRef = useRef(pattern);
  patternRef.current = pattern;
  const silentRef = useRef(silent);
  silentRef.current = silent;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    let raf = 0;
    let phase = 0;

    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const { clientWidth, clientHeight } = canvas;
      canvas.width = Math.max(1, clientWidth * dpr);
      canvas.height = Math.max(1, clientHeight * dpr);
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    const analyser = engine.getAnalyser();
    const data = analyser ? new Uint8Array(analyser.fftSize) : null;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx2d.clearRect(0, 0, w, h);

      const isSilent = silentRef.current;

      // grid
      ctx2d.strokeStyle = "rgba(133,152,176,0.12)";
      ctx2d.lineWidth = 1;
      ctx2d.beginPath();
      for (let x = 0; x <= w; x += w / 16) {
        ctx2d.moveTo(x, 0);
        ctx2d.lineTo(x, h);
      }
      ctx2d.moveTo(0, h / 2);
      ctx2d.lineTo(w, h / 2);
      ctx2d.stroke();

      const traceColor = isSilent ? "#ffb03a" : "#4cc9f0";
      ctx2d.lineWidth = 2;
      ctx2d.strokeStyle = playing ? traceColor : `${traceColor}66`;
      ctx2d.shadowColor = isSilent ? "rgba(255,176,58,0.7)" : "rgba(76,201,240,0.7)";
      ctx2d.shadowBlur = playing ? 10 : 4;
      ctx2d.beginPath();

      const playPhase = engine.getVisualPhase();

      if (!isSilent && analyser && data && playing) {
        // ---- mode A: live master bus ----
        analyser.getByteTimeDomainData(data);
        const slice = w / data.length;
        for (let i = 0; i < data.length; i++) {
          const y = (data[i] / 255) * h;
          if (i === 0) ctx2d.moveTo(0, y);
          else ctx2d.lineTo(i * slice, y);
        }
      } else if (isSilent && playing && playPhase >= 0) {
        // ---- mode B: pattern-derived synthetic trace (no audio exists) ----
        const p = patternRef.current;
        const stepW = w / 16;
        for (let x = 0; x <= w; x += 2) {
          const stepFloat = (x / w) * 16;
          const behind = (((stepFloat - playPhase) % 16) + 16) % 16; // steps since the playhead passed
          const env = Math.exp(-behind * 0.5);
          const s = Math.floor(stepFloat);
          let sig = 0;
          if (p.kick[s]) sig += Math.sin(x * 0.045) * 1.0;
          if (p.snare[s]) sig += (rnd(x) - 0.5) * 1.3;
          if (p.hat[s]) sig += Math.sin(x * 0.5) * 0.34 + (rnd(x * 1.7) - 0.5) * 0.3;
          if (p.clap[s]) sig += (rnd(x * 2.3) - 0.5) * 0.95 * Math.abs(Math.sin(x * 0.19));
          const y = h / 2 + sig * env * h * 0.34;
          if (x === 0) ctx2d.moveTo(x, y);
          else ctx2d.lineTo(x, y);
        }
      } else {
        // idle shimmer so the scope feels alive before playback
        phase += 0.03;
        for (let x = 0; x <= w; x += 3) {
          const y =
            h / 2 +
            Math.sin(x * 0.02 + phase) * 3 +
            Math.sin(x * 0.055 - phase * 1.6) * 1.5;
          if (x === 0) ctx2d.moveTo(x, y);
          else ctx2d.lineTo(x, y);
        }
      }
      ctx2d.stroke();
      ctx2d.shadowBlur = 0;

      // mode tag
      ctx2d.font = "9px 'IBM Plex Mono', monospace";
      ctx2d.fillStyle = isSilent ? "rgba(255,176,58,0.75)" : "rgba(76,201,240,0.6)";
      ctx2d.fillText(isSilent ? "SYNTHETIC · PATTERN-DERIVED · NO AUDIO" : "MASTER BUS · ANALYSER", 8, 12);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [engine, playing]);

  // voice legend for the synthetic trace
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="h-24 w-full sm:h-28"
        aria-label={
          silent
            ? "Pattern-derived synthetic scope (silent mode, no audio)"
            : "Live oscilloscope of the master bus"
        }
      />
      {silent && (
        <div className="absolute bottom-1.5 right-2 flex items-center gap-1.5 font-mono text-[9px] tracking-wider text-sig-amber/80">
          {VOICES.map((v) => (
            <span key={v.id} className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: v.color }} />
              {v.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
