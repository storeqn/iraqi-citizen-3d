import { Mission, Snapshot } from "../missions/session";
export type Progress = {
  version: 2;
  completed: Record<string, { score: number; stars: number; balance: number }>;
  total: number;
  settings: {
    quality: "low" | "medium" | "high";
    muted: boolean;
    outfit: "white" | "cream" | "mint";
  };
  resume: Snapshot | null;
};
export function fresh(): Progress {
  return {
    version: 2,
    completed: {},
    total: 0,
    settings: { quality: "medium", muted: false, outfit: "white" },
    resume: null,
  };
}
export function validSnapshot(s: unknown): s is Snapshot {
  if (!s || typeof s !== "object") return false;
  const d = s as Snapshot;
  if (
    !Number.isInteger(d.stage) ||
    d.stage < 1 ||
    d.stage > 8 ||
    !Array.isArray(d.ledger) ||
    d.ledger.length > 300 ||
    !Array.isArray(d.selected) ||
    d.selected.length > 100 ||
    !d.selected.every((x) => typeof x === "string" && x.length < 100)
  )
    return false;
  for (const k of [
    "elapsed",
    "balance",
    "score",
    "step",
    "index",
    "distance",
    "coins",
    "hits",
    "fuel",
    "phase",
  ] as const)
    if (!Number.isFinite(d[k]) || d[k] < 0 || d[k] > 10000000) return false;
  for (const k of [
    "balance",
    "score",
    "step",
    "coins",
    "hits",
    "fuel",
    "phase",
  ] as const)
    if (!Number.isSafeInteger(d[k])) return false;
  if (
    d.elapsed >= new Mission(d.stage).config.time ||
    d.distance > 200 ||
    d.fuel > 10 ||
    d.coins > 32 ||
    d.step > 55
  )
    return false;
  if (
    !d.ledger.every(
      (e) =>
        e &&
        typeof e.id === "string" &&
        typeof e.label === "string" &&
        Number.isSafeInteger(e.amount) &&
        Math.abs(e.amount) <= 10000000,
    )
  )
    return false;
  if (new Set(d.selected).size !== d.selected.length) return false;
  if (
    new Mission(d.stage).wallet.balance +
      d.ledger.reduce((sum, e) => sum + e.amount, 0) !==
    d.balance
  )
    return false;
  return (
    d.index >= 1 &&
    d.index <= 2 &&
    d.phase <= 2 &&
    d.hits < 3 &&
    d.ledger.every(
      (e) =>
        e &&
        typeof e.id === "string" &&
        typeof e.label === "string" &&
        Number.isSafeInteger(e.amount) &&
        Math.abs(e.amount) <= 10000000,
    ) &&
    new Set(d.ledger.map((e) => e.id)).size === d.ledger.length
  );
}
export function loadProgress(): Progress {
  const p = fresh();
  try {
    const raw = JSON.parse(
      localStorage.getItem("citizen-inflation-v2") || "null",
    );
    if (!raw || raw.version !== 2) return p;
    for (let i = 1; i <= 8; i++) {
      const c = raw.completed?.[i];
      if (
        c &&
        Number.isSafeInteger(c.score) &&
        c.score >= 0 &&
        c.score < 100000 &&
        [1, 2, 3].includes(c.stars) &&
        Number.isSafeInteger(c.balance) &&
        c.balance >= 0 &&
        c.balance <= 10000000
      )
        p.completed[i] = c;
    }
    p.total = Object.values(p.completed).reduce((sum, c) => sum + c.score, 0);
    if (["low", "medium", "high"].includes(raw.settings?.quality))
      p.settings.quality = raw.settings.quality;
    if (typeof raw.settings?.muted === "boolean")
      p.settings.muted = raw.settings.muted;
    if (["white", "cream", "mint"].includes(raw.settings?.outfit))
      p.settings.outfit = raw.settings.outfit;
    if (validSnapshot(raw.resume)) {
      const m = Mission.restore(raw.resume);
      if (m.remaining > 0) p.resume = m.snapshot();
    }
    return p;
  } catch {
    return p;
  }
}
export function saveProgress(p: Progress) {
  try {
    localStorage.setItem("citizen-inflation-v2", JSON.stringify(p));
  } catch {}
}
export function complete(p: Progress, m: Mission) {
  if (m.status !== "won") return false;
  const stars =
    m.remaining / m.config.time > 0.55
      ? 3
      : m.remaining / m.config.time > 0.2
        ? 2
        : 1;
  const old = p.completed[m.stage];
  if (!old || m.score > old.score)
    p.completed[m.stage] = { score: m.score, stars, balance: m.wallet.balance };
  p.total = Object.values(p.completed).reduce((sum, c) => sum + c.score, 0);
  p.resume = null;
  saveProgress(p);
  return true;
}
