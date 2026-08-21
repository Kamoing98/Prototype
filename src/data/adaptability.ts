export interface Indicator {
  sign: 1 | -1;
  text: string;
  evidence: string[];
}

export interface Axis {
  id: string;
  name: string;
  weight: number;
  rating: number;
  color: string;
  blurb: string;
  indicators: Indicator[];
}

export const META = {
  form: "FORM AI-7 · REV 2",
  subject: "CANDIDATE-01",
  reviewer: "PEER-03 · calibration cohort",
  period: "Sprint 2 · pivot window T+3:20 → T+3:54",
  status: "FINAL — countersigned",
};

export const INDEX = {
  value: 94,
  weighted: "4.71 / 5.0",
  band: "EXCEPTIONAL",
  bandNote: "models adaptability under constraint · top decile of cohort reviews (n = 12)",
};

export const AXES: Axis[] = [
  {
    id: "composure",
    name: "COMPOSURE",
    weight: 30,
    rating: 4.6,
    color: "#ffb03a",
    blurb: "Emotional steadiness and decision quality while the pivot landed on a fixed deadline.",
    indicators: [
      {
        sign: 1,
        text: "First response to the S-2 directive was to enumerate impact and draft the delta plan — roughly six minutes of reading and writing before any code changed. Sequence: understand, document, then build.",
        evidence: ["SDA-01", "T+03:20"],
      },
      {
        sign: 1,
        text: "When the clock-domain swap (AudioContext.currentTime ↔ performance.now) exposed a timebase mismatch on mid-playback toggling, it was diagnosed as a time-domain problem and fixed inside setSilent() with a controlled transport restart — no rewrite spiral.",
        evidence: ["setSilent()", "E-03 lineage"],
      },
      {
        sign: 1,
        text: "Error-log discipline held under time pressure: pivot work was still logged and attributed rather than skipped to save minutes.",
        evidence: ["ERROR LOG", "T+03:31"],
      },
      {
        sign: -1,
        text: "Worked the entire 34-minute pivot window without a pause. Recorded as a sustainability watch item, not a performance defect.",
        evidence: ["OBSERVATION"],
      },
    ],
  },
  {
    id: "communication",
    name: "COMMUNICATION",
    weight: 35,
    rating: 4.8,
    color: "#4cc9f0",
    blurb: "Clarity, candour and timeliness of stakeholder signalling before, during and after the pivot.",
    indicators: [
      {
        sign: 1,
        text: "SDA-01 was written before the adaptation code — the trade was documented before it was executed. Every scope cut (swing, chaining, mic voice) carried a minute-level rationale, so objections could arrive while they were still cheap.",
        evidence: ["SDA-01", "−145 min"],
      },
      {
        sign: 1,
        text: "Every user-visible consequence of the pivot self-announces in the artifact: SILENT CLOCK status readout, SYNTHETIC · NO AUDIO scope label, S-2 note on the signal path. No silent behaviour changes.",
        evidence: ["S-2 NOTE", "SCOPE LABEL"],
      },
      {
        sign: 1,
        text: "Backlog items were not quietly deleted — two moved explicitly to Sprint 3, one marked WON'T-DO with reasons. The board tells the truth about what the pivot cost.",
        evidence: ["BACKLOG BOARD"],
      },
      {
        sign: -1,
        text: "Status signalling was async-written only. In a hybrid room, a 30-second verbal flag would have complemented the document.",
        evidence: ["OBSERVATION"],
      },
    ],
  },
  {
    id: "flexibility",
    name: "FLEXIBILITY",
    weight: 35,
    rating: 4.7,
    color: "#5cd97f",
    blurb: "Willingness and technical ability to re-shape plan, architecture and scope around the new constraint.",
    indicators: [
      {
        sign: 1,
        text: "Silent mode shares the same transport code path via a dual-clock design instead of a parallel mute implementation — the adaptation improved the architecture rather than bypassing it.",
        evidence: ["DUAL CLOCK", "S-2"],
      },
      {
        sign: 1,
        text: "Shed 145 min of planned scope to absorb 34 min of new scope — net −111 min. Treated scope as currency, not scripture.",
        evidence: ["SDA-01", "NET −111 min"],
      },
      {
        sign: 1,
        text: "Ran a self-imposed 9/9 regression matrix after the pivot and verified pre-pivot localStorage payloads still load. Adaptation shipped with its own proof of non-regression.",
        evidence: ["REGRESSION 9/9"],
      },
      {
        sign: -1,
        text: "Initial instinct was to retain the full Sprint-1 backlog; one explicit self-correction pass was needed to actually shed scope. Flexibility was a decision, not a reflex — still arrived inside the window.",
        evidence: ["BACKLOG BOARD"],
      },
    ],
  },
];

export const QUOTES = [
  "When the directive landed, the first words were 'okay — what's the cheapest honest version of this?' and the delta doc got written before any code. That sequence tells you everything.",
  "Cut 145 minutes of their own planned features and documented every cut with a reason. I've watched people fight for features; this was the opposite, and faster.",
  "No drama, no 'but the deadline' pushback. Just: here's what changes, here's what I'm shedding, here's the regression plan — then it was done in 34 minutes.",
];

export const CALIBRATION = {
  note:
    "Across the pivot window the subject demonstrated the full adaptation loop — absorb the constraint, price the trade, document it, execute it, and prove nothing regressed — without supervision and without schedule slip. The two attention items are sustainability and channel balance, not capability. Compared against the cohort's twelve recorded pivot responses, this is the most complete loop observed in the shortest window.",
  recommendation:
    "Recommended as a reference profile for cohort adaptability calibration. Index 94 places the subject in the top decile.",
};

export const HANDLING = [
  { label: "DISTRIBUTION", value: "Calibration committee + subject only" },
  { label: "RETENTION", value: "12 months, then purge" },
  { label: "REPRODUCTION", value: "Prohibited — do not attach to name" },
];
