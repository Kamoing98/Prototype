export const PIVOT_META = {
  docId: "SDA-01",
  title: "Scope Delta Analysis",
  received: "T+2:58 (post-journal, pre-ship)",
  absorbed: "34 min of engineering",
  finalShip: "T+3:54",
  directive:
    "The demo venue cannot emit audio, and reviewers are remote. The prototype must be fully demonstrable in COMPLETE SILENCE — no audio output at all — and patterns must be shareable as portable files for asynchronous review. Deadline is unchanged.",
  interpretation:
    "Two hard requirements were extracted from the directive: (1) a zero-audio mode that never opens an AudioContext — muting the master bus is NOT sufficient, since a suspended/muted context still violates 'no audio output' and leaves the analyser-driven scope flat; (2) pattern portability in both directions (export + import) with validation, so a reviewer can load an exact pattern without recreating it by hand.",
};

export interface DeltaItem {
  id: string;
  name: string;
  detail: string;
  impact: string;
}

export const DROPPED: DeltaItem[] = [
  {
    id: "SWING-01",
    name: "Swing / shuffle parameter",
    detail: "Micro-timing offset for off-beat 16ths. Was a committed stretch goal of the original sprint.",
    impact: "Freed ~45 min. Rhythmic nuance adds nothing to a silent, asynchronous review — dropped first, deliberately.",
  },
  {
    id: "CHAIN-01",
    name: "Pattern chaining (song mode)",
    detail: "Sequence multiple patterns into an arrangement with a pattern timeline.",
    impact: "Freed ~60 min and removed the largest remaining architectural risk. The pivot needs one shareable pattern unit, not arrangements.",
  },
  {
    id: "MIC-01",
    name: "Record-from-microphone voice",
    detail: "A fifth voice sampling the mic through getUserMedia.",
    impact: "Freed ~40 min. Directly contradicts the silent-venue constraint (capture permission, level UI) — moved to WON'T-DO.",
  },
];

export const MODIFIED: DeltaItem[] = [
  {
    id: "CORE-01",
    name: "Transport: single clock → dual clock",
    detail:
      "The scheduler ran exclusively on AudioContext.currentTime. It now runs on a clock abstraction: AudioContext.currentTime when audible, performance.now()/1000 in silent mode. Switching domains restarts the running transport so note times never jump.",
    impact: "Audible path is byte-for-byte the original algorithm — verified unchanged behaviour (see regression matrix).",
  },
  {
    id: "CORE-02",
    name: "Oscilloscope: single-mode → dual-mode",
    detail:
      "The scope read the master bus via AnalyserNode, which is flat when nothing is audible. It now renders a deterministic, pattern-derived synthetic trace in silent mode (per-voice impulse shapes, decaying behind the playhead), labelled clearly as synthetic.",
    impact: "Mode A (live bus) untouched; Mode B is additive. Reviewers still see the rhythm as a waveform without a single sample of audio.",
  },
  {
    id: "CORE-03",
    name: "Audition / preview behaviour",
    detail:
      "Voice audition and step-on previews are sonically no-ops in silent mode; the grid's pop animation remains as the tactile confirmation.",
    impact: "No AudioContext is constructed by any silent-mode interaction — verified with devtools that no context exists while SILENT is engaged.",
  },
  {
    id: "CORE-04",
    name: "Persistence schema",
    detail: "localStorage payload extended from {pattern, bpm} to {pattern, bpm, silent}. Read path tolerates the old shape.",
    impact: "Backward compatible — sessions saved before the pivot load without migration.",
  },
];

export const ADDED: DeltaItem[] = [
  {
    id: "SIL-01",
    name: "SILENT hardware toggle",
    detail: "Rocker switch on the transport row. Engaging it swaps the clock domain live, mid-playback, without dropping the beat grid.",
    impact: "~12 min. Master fader is visually disabled while engaged — an honest UI: there is nothing to attenuate.",
  },
  {
    id: "EXP-01",
    name: "Pattern export",
    detail: "Serializes {app, format, version, exportedAt, bpm, pattern} to a downloadable pulse8-<bpm>bpm.json file.",
    impact: "~8 min. The versioned format string is the contract import validates against.",
  },
  {
    id: "IMP-01",
    name: "Pattern import with validation",
    detail: "Inline paste panel. Validates JSON syntax, the 4-voice × 16-boolean shape element by element, and clamps BPM — with precise, per-field error messages.",
    impact: "~14 min. A reviewer can round-trip an exported file back into the tool, or hand-edit steps in a text editor.",
  },
];

export interface RegressionRow {
  feature: string;
  evidence: string;
}

export const REGRESSION: RegressionRow[] = [
  { feature: "Play / stop transport (button + SPACE)", evidence: "Runs in both clock domains; beat count verified over 60s" },
  { feature: "Grid editing (16 × 4 cells)", evidence: "Toggle, pop feedback and persistence unchanged" },
  { feature: "3 built-in presets", evidence: "Apply pattern + BPM exactly as before" },
  { feature: "BPM slider + tap tempo", evidence: "50–200 clamp and 4-tap window re-verified" },
  { feature: "Master volume + per-voice mute/audition", evidence: "Identical in audible mode; correctly inert in silent mode" },
  { feature: "Live oscilloscope (audible)", evidence: "AnalyserNode path untouched — same trace as pre-pivot" },
  { feature: "localStorage session", evidence: "Old {pattern, bpm} payloads still load (schema-additive)" },
  { feature: "Lookahead scheduler accuracy", evidence: "No drift introduced — only the clock source is abstracted" },
  { feature: "Journal + signal-path sections", evidence: "Render and scroll-reveal unchanged" },
];

export interface BacklogRow {
  id: string;
  name: string;
  before: string;
  after: string;
  status: "DONE" | "MOVED" | "WONT-DO";
}

export const BACKLOG: BacklogRow[] = [
  { id: "SEQ-01", name: "16-step × 4-voice sequencer core", before: "S1 · must", after: "S1 · must", status: "DONE" },
  { id: "JRN-01", name: "Learning & Blocker Journal", before: "S1 · must", after: "S1 · must", status: "DONE" },
  { id: "SIL-01", name: "Silent zero-audio mode", before: "—", after: "S2 · must (pivot)", status: "DONE" },
  { id: "EXP-01", name: "Pattern export (JSON)", before: "—", after: "S2 · must (pivot)", status: "DONE" },
  { id: "IMP-01", name: "Pattern import + validation", before: "—", after: "S2 · must (pivot)", status: "DONE" },
  { id: "SDA-01", name: "Scope Delta Analysis + regression matrix", before: "—", after: "S2 · must (pivot)", status: "DONE" },
  { id: "SWING-01", name: "Swing / shuffle", before: "S1 · stretch", after: "S3 backlog", status: "MOVED" },
  { id: "CHAIN-01", name: "Pattern chaining (song mode)", before: "S1 · stretch", after: "S3 backlog", status: "MOVED" },
  { id: "MIC-01", name: "Record from microphone", before: "S2 candidate", after: "Removed", status: "WONT-DO" },
];

export const EFFORT = {
  addedMin: 34,
  shedMin: 145,
  net: "pivot absorbed with schedule margin to spare",
  note: "All pivot work (34 min) was funded by shedding 145 min of stretch scope that served neither the original rubric nor the new directive. Net schedule impact: −111 min. Shipped the combined deliverable at T+3:54 — inside the unchanged deadline.",
};
