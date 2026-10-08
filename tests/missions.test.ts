import test from "node:test";
import assert from "node:assert/strict";
import { Mission } from "../src/missions/session";
import { Wallet, purchasingPower } from "../src/economy/wallet";
import { goods, family } from "../src/data/missions";
import {
  fresh,
  complete,
  validSnapshot,
  loadProgress,
} from "../src/utils/progress";
import { runnerItems, touching, laneX } from "../src/minigames/runner";
function finishMarket() {
  const m = new Mission(1);
  goods.forEach((g) => m.buy(g.id));
  return m;
}
test("market requires all five goods and charges each once", () => {
  const m = new Mission(1);
  assert.ok(m.buy("rice"));
  const balance = m.wallet.balance;
  assert.equal(m.buy("rice"), false);
  assert.equal(m.wallet.balance, balance);
  goods.filter((g) => g.id !== "rice").forEach((g) => m.buy(g.id));
  assert.equal(m.status, "won");
  assert.equal(m.wallet.balance, 9000);
  assert.equal(m.wallet.ledger.length, 5);
});
test("market inflation raises prices but remains winnable and respects budget", () => {
  const m = new Mission(1);
  for (let i = 0; i < 90; i++) m.tick(1);
  assert.equal(m.inflation, 1.32);
  goods.forEach((g) => m.buy(g.id));
  assert.equal(m.status, "won");
  assert.ok(m.wallet.balance >= 0);
  const poor = new Mission(1);
  poor.wallet.balance = 1;
  assert.equal(poor.buy("rice"), false);
  assert.equal(poor.selected.size, 0);
});
test("market timeout loses, cannot buy after ending", () => {
  const m = new Mission(1);
  for (let i = 0; i < 120; i++) m.tick(1);
  assert.equal(m.status, "lost");
  assert.equal(m.buy("rice"), false);
});
test("runner coins and hits have unique ids; three hits fail without debt", () => {
  const m = new Mission(2);
  assert.equal(m.collect("a"), true);
  assert.equal(m.collect("a"), false);
  m.collision("bill1");
  assert.equal(m.wallet.balance, 0);
  assert.equal(m.collision("bill1"), false);
  m.collision("bill2");
  m.collision("bill3");
  assert.equal(m.status, "lost");
  assert.equal(m.collect("new"), false);
});
test("runner wins distance target with eight coins, loses if insufficient", () => {
  const m = new Mission(2);
  for (let i = 0; i < 8; i++) m.collect(String(i));
  while (m.status === "playing") m.run(0.1);
  assert.equal(m.status, "won");
  const n = new Mission(2);
  while (n.status === "playing") n.run(0.1);
  assert.equal(n.status, "lost");
});
test("runner obstacle can be jumped and adjacent lanes are safe", () => {
  const b = runnerItems().find((i) => i.kind === "bill")!;
  assert.equal(touching(b, b.distance, laneX(b.lane), 0), true);
  assert.equal(touching(b, b.distance, laneX(b.lane), 1), false);
  assert.equal(touching(b, b.distance, laneX(b.lane) + 2.6, 0), false);
  b.taken = true;
  assert.equal(touching(b, b.distance, laneX(b.lane), 0), false);
});
test("bills paid in sensible order preserve reserve; late rent changes outcome", () => {
  const m = new Mission(3);
  ["rent", "power", "water", "internet"].forEach((a) => m.choose(a));
  assert.equal(m.status, "won");
  assert.equal(m.wallet.balance, 90000);
  assert.equal(m.choose("rent"), false);
  const n = new Mission(3);
  ["power", "water", "rent", "internet"].forEach((a) => n.choose(a));
  assert.equal(n.status, "lost");
  assert.equal(n.wallet.balance, 30000);
});
test("nominal salary is constant while purchasing power falls", () => {
  const m = new Mission(4);
  m.choose("salary");
  for (let i = 0; i < 3; i++) m.choose("wave");
  assert.equal(m.wallet.balance, 1000000);
  assert.ok(m.power < 1000000);
  assert.equal(purchasingPower(1000000, 1.25), 800000);
  m.choose("real");
  assert.equal(m.status, "won");
  const n = new Mission(4);
  n.choose("salary");
  for (let i = 0; i < 3; i++) n.choose("wave");
  n.choose("nominal");
  assert.equal(n.status, "lost");
});
test("transport choices differ by cost and time", () => {
  for (const [choice, expected] of [
    ["negotiate", "won"],
    ["bus", "won"],
    ["taxi", "lost"],
    ["walk", "lost"],
  ] as const) {
    const m = new Mission(5);
    m.choose(choice);
    assert.equal(m.status, expected);
    assert.ok(m.wallet.balance >= 0);
  }
});
test("bargaining has distinct polite, default and rude outcomes", () => {
  const m = new Mission(6);
  m.choose("ask");
  m.choose("accept");
  assert.equal(m.status, "won");
  assert.equal(m.wallet.balance, 4000);
  const n = new Mission(6);
  n.choose("accept");
  assert.equal(n.status, "lost");
  const rude = new Mission(6);
  rude.choose("insult");
  assert.equal(rude.status, "lost");
});
test("family needs all essentials and a reserve", () => {
  const m = new Mission(7);
  family.filter((f) => f.essential).forEach((f) => m.choose(f.id));
  m.choose("done");
  assert.equal(m.status, "won");
  assert.equal(m.wallet.balance, 140000);
  const n = new Mission(7);
  n.choose("tv");
  n.choose("done");
  assert.equal(n.status, "lost");
});
test("three minigames must all succeed in sequence", () => {
  const m = new Mission(8);
  for (let i = 0; i < 10; i++) m.choose("pump");
  m.choose("stop");
  assert.equal(m.phase, 1);
  m.choose("phone-budget");
  assert.equal(m.phase, 2);
  m.choose("school-list");
  assert.equal(m.status, "won");
  assert.equal(m.wallet.balance, 110000);
});
test("fuel underfill and overfill lose", () => {
  const n = new Mission(8);
  n.choose("stop");
  assert.equal(n.status, "lost");
  const m = new Mission(8);
  for (let i = 0; i < 11; i++) m.choose("pump");
  assert.equal(m.status, "lost");
});
test("expensive phone and luxury school supplies can fail", () => {
  for (const variant of ["phone", "school"]) {
    const m = new Mission(8);
    for (let i = 0; i < 10; i++) m.choose("pump");
    m.choose("stop");
    m.choose(variant === "phone" ? "phone-premium" : "phone-budget");
    if (variant === "school") m.choose("school-luxury");
    assert.equal(m.status, "lost");
    assert.ok(m.wallet.balance >= 0);
  }
});
test("wallet rejects debt, invalid values and duplicate rewards", () => {
  const w = new Wallet(100);
  assert.equal(w.spend("bad", "bad", 101), false);
  assert.equal(w.spend("negative", "bad", -2), false);
  assert.equal(w.spend("float", "bad", 1.1), false);
  assert.ok(w.credit("reward", "reward", 100));
  assert.equal(w.credit("reward", "reward", 100), false);
  assert.equal(w.balance, 200);
});
test("completion records best score without reward farming", () => {
  const p = fresh(),
    m = finishMarket();
  assert.ok(complete(p, m));
  const score = p.total;
  assert.ok(complete(p, m));
  assert.equal(p.total, score);
  m.score = 1;
  complete(p, m);
  assert.equal(p.total, score);
  const failed = new Mission(2);
  failed.finish(false, "fail");
  assert.equal(complete(p, failed), false);
});
test("resuming market, bills and runner preserves spent ids and decisions", () => {
  for (const stage of [1, 2, 3]) {
    const m = new Mission(stage);
    if (stage === 1) m.buy("rice");
    if (stage === 2) m.collect("coin-0");
    if (stage === 3) m.choose("rent");
    const snapshot = m.snapshot();
    assert.ok(validSnapshot(snapshot));
    const r = Mission.restore(snapshot);
    assert.deepEqual(r.snapshot(), snapshot);
    if (stage === 1) assert.equal(r.buy("rice"), false);
    if (stage === 2) assert.equal(r.collect("coin-0"), false);
    if (stage === 3) assert.equal(r.choose("rent"), false);
  }
});
test("progress rejects corrupt data and rebuilds total from valid results", () => {
  (globalThis as any).localStorage = {
    getItem: () => "{broken",
    setItem: () => {},
  };
  assert.deepEqual(loadProgress(), fresh());
  const p = fresh();
  p.completed[1] = { score: 1000, stars: 3, balance: 0 };
  p.total = 999999;
  const raw = JSON.stringify(p);
  (globalThis as any).localStorage.getItem = () => raw;
  assert.equal(loadProgress().total, 1000);
  const invalid = { ...new Mission(1).snapshot(), balance: -10 };
  assert.equal(validSnapshot(invalid), false);
});
test("malformed resume ledger is rejected without throwing", () => {
  const d = new Mission(1).snapshot();
  (d as any).ledger = [null];
  assert.doesNotThrow(() => validSnapshot(d));
  assert.equal(validSnapshot(d), false);
  const m = new Mission(1).snapshot();
  m.balance++;
  assert.equal(validSnapshot(m), false);
});
