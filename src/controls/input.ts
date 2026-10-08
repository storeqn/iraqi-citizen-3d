export class Input {
  keys = new Set<string>();
  x = 0;
  z = 0;
  yaw = 0;
  pitch = 0.42;
  punch = false;
  jump = false;
  interact = false;
  run = false;
  active = false;
  constructor(canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", (e) => {
      if (["Space", "ArrowUp", "ArrowDown"].includes(e.code))
        e.preventDefault();
      if (!this.active) return;
      this.keys.add(e.code);
      if (!e.repeat) {
        if (e.code === "KeyE") this.interact = true;
        if (e.code === "Space") this.jump = true;
        if (e.code === "KeyF") this.interact = true;
      }
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => this.clear());
    let drag: number | null = null,
      lastX = 0,
      lastY = 0;
    canvas.addEventListener("pointerdown", (e) => {
      if (!this.active) return;
      drag = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (e.pointerId !== drag) return;
      this.yaw -= (e.clientX - lastX) * 0.006;
      this.pitch = Math.max(
        0.18,
        Math.min(0.85, this.pitch + (e.clientY - lastY) * 0.004),
      );
      lastX = e.clientX;
      lastY = e.clientY;
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId === drag) drag = null;
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    const stick = document.querySelector<HTMLElement>("#stick")!,
      knob = document.querySelector<HTMLElement>("#knob")!;
    let id: number | null = null,
      cx = 0,
      cy = 0;
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - cx,
        dy = e.clientY - cy,
        l = Math.max(42, Math.hypot(dx, dy));
      this.x = dx / l;
      this.z = -dy / l;
      knob.style.transform = `translate(${this.x * 35}px,${-this.z * 35}px)`;
    };
    stick.addEventListener("pointerdown", (e) => {
      if (!this.active) return;
      id = e.pointerId;
      const r = stick.getBoundingClientRect();
      cx = r.x + r.width / 2;
      cy = r.y + r.height / 2;
      stick.setPointerCapture(id);
      move(e);
    });
    stick.addEventListener("pointermove", move);
    const release = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = null;
      this.x = this.z = 0;
      knob.style.transform = "";
    };
    stick.addEventListener("pointerup", release);
    stick.addEventListener("pointercancel", release);
    for (const name of ["jump", "interact"] as const)
      document
        .querySelector("#" + name)!
        .addEventListener("pointerdown", (e) => {
          e.preventDefault();
          if (this.active) this[name] = true;
        });
  }
  movement() {
    return {
      x:
        this.x +
        (this.keys.has("KeyD") ? 1 : 0) -
        (this.keys.has("KeyA") ? 1 : 0),
      z:
        this.z +
        (this.keys.has("KeyW") ? 1 : 0) -
        (this.keys.has("KeyS") ? 1 : 0),
      run: this.keys.has("ShiftLeft") || Math.hypot(this.x, this.z) > 0.85,
    };
  }
  clear() {
    this.keys.clear();
    this.x = this.z = 0;
    this.punch = this.jump = this.interact = false;
  }
  consume(name: "punch" | "jump" | "interact") {
    const v = this[name];
    this[name] = false;
    return v;
  }
}
