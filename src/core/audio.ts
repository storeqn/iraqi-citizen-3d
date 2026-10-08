export class Audio {
  ctx: AudioContext | null = null;
  muted = false;
  unlock() {
    try {
      this.ctx ??= new AudioContext();
      void this.ctx.resume();
    } catch {}
  }
  tone(kind: "spawn" | "hit" | "jump") {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime,
      o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = kind === "hit" ? "triangle" : "sine";
    o.frequency.setValueAtTime(
      kind === "hit" ? 250 : kind === "jump" ? 400 : 650,
      t,
    );
    o.frequency.exponentialRampToValueAtTime(
      kind === "hit" ? 45 : 950,
      t + 0.19,
    );
    g.gain.setValueAtTime(0.13, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + 0.27);
  }
  announce() {
    if (this.muted || !("speechSynthesis" in window)) return;
    const v = new SpeechSynthesisUtterance("صعد الدولار");
    v.lang = "ar-IQ";
    v.rate = 1.1;
    v.volume = 0.65;
    speechSynthesis.cancel();
    speechSynthesis.speak(v);
  }
  stop() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }
}
