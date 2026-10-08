export type Settings = { quality: "low" | "medium" | "high"; muted: boolean };
export function readSave() {
  try {
    const p = JSON.parse(localStorage.getItem("citizen-save") || "{}");
    return {
      best: Number.isFinite(p.best) && p.best >= 0 ? p.best : 0,
      quality: ["low", "medium", "high"].includes(p.quality)
        ? (p.quality as Settings["quality"])
        : ("medium" as const),
      muted: typeof p.muted === "boolean" ? p.muted : false,
    };
  } catch {
    return { best: 0, quality: "medium" as const, muted: false };
  }
}
export function writeSave(data: ReturnType<typeof readSave>) {
  try {
    localStorage.setItem("citizen-save", JSON.stringify(data));
  } catch {
    /* Storage may be unavailable in private browsing. */
  }
}
