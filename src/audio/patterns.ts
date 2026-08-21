import { STEPS, type Pattern, type VoiceId } from "./engine";

function fromHits(hits: Partial<Record<VoiceId, number[]>>): Pattern {
  const empty = () => Array.from({ length: STEPS }, () => false);
  const p: Pattern = { kick: empty(), snare: empty(), hat: empty(), clap: empty() };
  for (const voice of Object.keys(hits) as VoiceId[]) {
    for (const i of hits[voice] ?? []) p[voice][i] = true;
  }
  return p;
}

export interface Preset {
  id: string;
  name: string;
  bpm: number;
  pattern: Pattern;
}

export const PRESETS: Preset[] = [
  {
    id: "floor",
    name: "FOUR-FLOOR",
    bpm: 122,
    pattern: fromHits({
      kick: [0, 4, 8, 12],
      clap: [4, 12],
      hat: [2, 6, 10, 14],
    }),
  },
  {
    id: "break",
    name: "BREAK 04",
    bpm: 96,
    pattern: fromHits({
      kick: [0, 2, 8, 10, 13],
      snare: [4, 7, 12, 15],
      hat: [0, 2, 4, 6, 8, 10, 12, 14],
    }),
  },
  {
    id: "electro",
    name: "ELECTRO",
    bpm: 112,
    pattern: fromHits({
      kick: [0, 3, 8, 10, 11],
      snare: [4, 12],
      hat: [0, 2, 4, 6, 8, 10, 12, 14],
      clap: [12],
    }),
  },
];

export function emptyPattern(): Pattern {
  const empty = () => Array.from({ length: STEPS }, () => false);
  return { kick: empty(), snare: empty(), hat: empty(), clap: empty() };
}

export function patternsEqual(a: Pattern, b: Pattern): boolean {
  return (Object.keys(a) as VoiceId[]).every((v) =>
    a[v].every((hit, i) => hit === b[v][i])
  );
}
