export type Point = { x: number; z: number };
export type Obstacle = { x: number; z: number; w: number; d: number };
export function clearPoint(p: Point, obstacles: Obstacle[], margin = 0.7) {
  return (
    Math.abs(p.x) < 17 &&
    Math.abs(p.z) < 27 &&
    !obstacles.some(
      (o) =>
        Math.abs(p.x - o.x) < o.w / 2 + margin &&
        Math.abs(p.z - o.z) < o.d / 2 + margin,
    )
  );
}
export function spawnPoint(
  player: Point,
  obstacles: Obstacle[],
  random = Math.random,
): Point | null {
  for (let i = 0; i < 80; i++) {
    const a = random() * Math.PI * 2,
      r = 5 + random() * 5,
      p = { x: player.x + Math.sin(a) * r, z: player.z + Math.cos(a) * r };
    if (clearPoint(p, obstacles) && Math.abs(p.x) < 6) return p;
  }
  return null;
}
export function canHit(player: Point, target: Point, yaw: number) {
  const dx = target.x - player.x,
    dz = target.z - player.z,
    d = Math.hypot(dx, dz);
  return (
    d <= 2.8 &&
    (d < 0.2 || (dx * Math.sin(yaw) + dz * Math.cos(yaw)) / d > 0.35)
  );
}
export class Round {
  score = 0;
  combo = 0;
  remaining = 90;
  lastHit = -Infinity;
  elapsed = 0;
  credited = new Set<string>();
  running = false;
  reset() {
    this.score = 0;
    this.combo = 0;
    this.remaining = 90;
    this.lastHit = -Infinity;
    this.elapsed = 0;
    this.credited.clear();
    this.running = true;
  }
  tick(dt: number) {
    if (!this.running) return;
    this.elapsed += dt;
    this.remaining = Math.max(0, 90 - this.elapsed);
    if (this.elapsed - this.lastHit > 22) this.combo = 0;
    if (!this.remaining) this.running = false;
  }
  hit(id: string) {
    if (!this.running || this.credited.has(id)) return false;
    this.credited.add(id);
    this.combo = this.elapsed - this.lastHit <= 22 ? this.combo + 1 : 1;
    this.lastHit = this.elapsed;
    this.score += 100;
    return true;
  }
  interval(random = Math.random) {
    return (
      Math.max(10, 20 - this.score / 300) +
      random() * Math.min(5, this.score / 300)
    );
  }
}
