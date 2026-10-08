export class Audio {
  ctx: AudioContext | null = null;
  muted = false;
  unlock() {
    try {
      this.ctx ??= new AudioContext();
      void this.ctx.resume();
    } catch {}
  }
  tone(kind: "coin" | "step" | "car" | "jump" | "win" | "lose" | "buy") {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime,
      o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type =
      kind === "car" ? "sawtooth" : kind === "lose" ? "triangle" : "sine";
    const frequency = {
      coin: 900,
      step: 65,
      car: 140,
      jump: 380,
      win: 600,
      lose: 220,
      buy: 700,
    }[kind];
    o.frequency.setValueAtTime(frequency, t);
    o.frequency.exponentialRampToValueAtTime(
      kind === "lose" ? 65 : kind === "step" ? 40 : frequency * 1.5,
      t + 0.15,
    );
    g.gain.setValueAtTime(kind === "step" ? 0.035 : 0.09, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.23);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + 0.25);
  }
  say(text: string) {
    if (this.muted || !("speechSynthesis" in window)) return;
    const v = new SpeechSynthesisUtterance(text);
    v.lang = "ar-IQ";
    v.rate = 1.05;
    v.volume = 0.6;
    speechSynthesis.cancel();
    speechSynthesis.speak(v);
  }
  stop() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }
}
