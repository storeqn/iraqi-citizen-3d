import test from "node:test";
import assert from "node:assert/strict";
import { createCanvas } from "@napi-rs/canvas";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Ray } from "@babylonjs/core/Culling/ray";
import "@babylonjs/core/Collisions/collisionCoordinator";
import { city } from "../src/world/city";
import { character } from "../src/player/character";
import { NPC } from "../src/npc/npc";
(globalThis as any).OffscreenCanvas = class {
  constructor(w: number, h: number) {
    return createCanvas(w, h);
  }
};
test("NullEngine initializes city, rig, textures, collision components, and NPC lifecycle", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const w = city(scene);
  const p = character(scene);
  assert.ok(scene.meshes.length > 200);
  assert.ok(w.obstacles.length > 15);
  assert.ok(scene.textures.length > 10);
  assert.ok(scene.collisionCoordinator);
  p.animate(1, true, true, 0.5, true);
  assert.ok(Number.isFinite(p.arms[1].rotation.x));
  p.root.getChildMeshes().forEach((m) => w.shadow.addShadowCaster(m));
  const npc = new NPC(
    scene,
    new Vector3(0, 0, 4),
    { id: "test", model: null },
    1,
  );
  npc.update(0.6, 1, p.root.position);
  assert.equal(npc.state, "idle");
  assert.ok(npc.hit(new Vector3(0, 0, 1)));
  assert.equal(npc.hit(new Vector3(0, 0, 1)), false);
  assert.equal(npc.update(3, 2, p.root.position), true);
  assert.doesNotThrow(() =>
    scene.pickWithRay(
      new Ray(new Vector3(0, 3, 0), new Vector3(1, 0, 0)),
      (m) => m.checkCollisions,
    ),
  );
  npc.dispose();
  p.dispose();
  scene.dispose();
  engine.dispose();
});
test("bundled original GLB loads with all four named animation groups", async () => {
  const { readFile } = await import("node:fs/promises");
  const { SceneLoader } = await import("@babylonjs/core/Loading/sceneLoader");
  await import("@babylonjs/loaders/glTF");
  const buffer = await readFile(
    new URL(
      "../public/models/characters/official-original.glb",
      import.meta.url,
    ),
  );
  assert.equal(buffer.readUInt32LE(0), 0x46546c67);
  const engine = new NullEngine(),
    scene = new Scene(engine);
  const imported = await SceneLoader.ImportMeshAsync(
    "",
    "",
    "data:model/gltf-binary;base64," + buffer.toString("base64"),
    scene,
    undefined,
    ".glb",
  );
  assert.ok(imported.meshes.length > 20);
  assert.deepEqual(imported.animationGroups.map((a) => a.name).sort(), [
    "Fall",
    "HitReaction",
    "Idle",
    "Walk",
  ]);
  scene.dispose();
  engine.dispose();
});
test("new city expansion has reachable interactions and a fictional dollar", async () => {
  const { expansion, dollar } = await import("../src/world/expansion");
  const { destinations, goods } = await import("../src/data/missions");
  const { clearPoint } = await import("../src/gameplay/rules");
  const engine = new NullEngine(),
    scene = new Scene(engine);
  const world = city(scene);
  expansion(scene, world.obstacles);
  const d = dollar(scene);
  d.animate(1);
  assert.ok(d.root.getChildMeshes().length >= 12);
  for (const p of [...Object.values(destinations), ...goods])
    assert.ok(clearPoint(p, world.obstacles, 0.4), JSON.stringify(p));
  scene.dispose();
  engine.dispose();
});
test("citizen GLB has all seven named player animations", async () => {
  const { readFile } = await import("node:fs/promises");
  const { SceneLoader } = await import("@babylonjs/core/Loading/sceneLoader");
  await import("@babylonjs/loaders/glTF");
  const b = await readFile(
    new URL(
      "../public/models/characters/citizen-original.glb",
      import.meta.url,
    ),
  );
  const engine = new NullEngine(),
    scene = new Scene(engine);
  const result = await SceneLoader.ImportMeshAsync(
    "",
    "",
    "data:model/gltf-binary;base64," + b.toString("base64"),
    scene,
    undefined,
    ".glb",
  );
  assert.deepEqual(result.animationGroups.map((a) => a.name).sort(), [
    "Celebrate",
    "Idle",
    "Interact",
    "Jump",
    "Run",
    "Sad",
    "Walk",
  ]);
  assert.ok(result.meshes.some((m) => m.name.includes("citizen-moustache")));
  scene.dispose();
  engine.dispose();
});
