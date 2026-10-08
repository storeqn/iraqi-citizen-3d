import test from "node:test";
import assert from "node:assert/strict";
import { Round, canHit, clearPoint, spawnPoint } from "../src/gameplay/rules";
test("award 100 once per unique NPC", () => {
  const r = new Round();
  r.reset();
  assert.equal(r.hit("one"), true);
  assert.equal(r.hit("one"), false);
  assert.equal(r.score, 100);
  r.hit("two");
  assert.equal(r.combo, 2);
  assert.equal(r.score, 200);
});
test("restart resets timing, score, combo and credited identities", () => {
  const r = new Round();
  r.reset();
  r.hit("one");
  r.tick(20);
  r.reset();
  assert.equal(r.score, 0);
  assert.equal(r.combo, 0);
  assert.equal(r.remaining, 90);
  assert.equal(r.credited.size, 0);
  assert.equal(r.hit("one"), true);
});
test("end prevents new points and combo expires", () => {
  const r = new Round();
  r.reset();
  r.hit("one");
  r.tick(23);
  assert.equal(r.combo, 0);
  r.tick(67);
  assert.equal(r.running, false);
  assert.equal(r.hit("two"), false);
});
test("spawn only within navigable world and outside obstacles", () => {
  const obstacles = [{ x: 0, z: 7, w: 4, d: 4 }];
  for (let i = 0; i < 1000; i++) {
    const p = spawnPoint({ x: 0, z: 0 }, obstacles);
    if (p) {
      assert.equal(clearPoint(p, obstacles), true);
      assert.ok(Math.hypot(p.x, p.z) >= 5);
      assert.ok(Math.hypot(p.x, p.z) <= 10);
    }
  }
  assert.equal(spawnPoint({ x: 100, z: 100 }, []), null);
});
test("hit requires distance and facing", () => {
  assert.ok(canHit({ x: 0, z: 0 }, { x: 0, z: 2 }, 0));
  assert.equal(canHit({ x: 0, z: 0 }, { x: 0, z: -2 }, 0), false);
  assert.equal(canHit({ x: 0, z: 0 }, { x: 0, z: 4 }, 0), false);
});
test("spawn cadence remains 10–20 seconds", () => {
  const r = new Round();
  for (const score of [0, 100, 1000, 100000]) {
    r.score = score;
    for (const rand of [0, 0.5, 0.99999]) {
      const interval = r.interval(() => rand);
      assert.ok(interval >= 10 && interval <= 20);
    }
  }
});
