import { useEffect, useRef } from "react";

interface Props {
  engine: { getAnalyser(): AnalyserNode | null };
  playing: boolean;
}

/** Oscilloscope fed by the AnalyserNode; draws a calm idle shimmer when silent. */
export default function Visualizer({ engine, playing }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

      ctx2d.lineWidth = 2;
      ctx2d.strokeStyle = playing ? "#4cc9f0" : "rgba(76,201,240,0.4)";
      ctx2d.shadowColor = "rgba(76,201,240,0.7)";
      ctx2d.shadowBlur = playing ? 10 : 4;
      ctx2d.beginPath();

      if (analyser && data && playing) {
        analyser.getByteTimeDomainData(data);
        const slice = w / data.length;
        for (let i = 0; i < data.length; i++) {
          const y = (data[i] / 255) * h;
          if (i === 0) ctx2d.moveTo(0, y);
          else ctx2d.lineTo(i * slice, y);
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
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [engine, playing]);

  return (
    <canvas
      ref={canvasRef}
      className="h-24 w-full sm:h-28"
      aria-label="Live oscilloscope of the master bus"
    />
  );
}
