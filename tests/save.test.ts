import test from "node:test";
import assert from "node:assert/strict";
import { readSave, writeSave } from "../src/utils/save";
test("corrupt and invalid saves use defaults", () => {
  let raw = "{broken";
  (globalThis as any).localStorage = { getItem: () => raw, setItem: () => {} };
  assert.deepEqual(readSave(), { best: 0, quality: "medium", muted: false });
  raw = JSON.stringify({ best: -10, quality: "ultra", muted: "true" });
  assert.deepEqual(readSave(), { best: 0, quality: "medium", muted: false });
  raw = JSON.stringify({ best: 200, quality: "low", muted: true });
  assert.deepEqual(readSave(), { best: 200, quality: "low", muted: true });
});
test("unavailable or full storage never blocks gameplay", () => {
  (globalThis as any).localStorage = {
    getItem: () => {
      throw Error("blocked");
    },
    setItem: () => {
      throw Error("full");
    },
  };
  assert.equal(readSave().best, 0);
  assert.doesNotThrow(() =>
    writeSave({ best: 100, quality: "medium", muted: false }),
  );
});
