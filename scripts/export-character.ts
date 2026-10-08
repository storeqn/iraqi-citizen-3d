import { writeFile } from "node:fs/promises";
import { createCanvas } from "@napi-rs/canvas";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { Animation } from "@babylonjs/core/Animations/animation";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { GLTF2Export } from "@babylonjs/serializers/glTF";
import { character } from "../src/player/character";
(globalThis as any).OffscreenCanvas = class {
  constructor(w: number, h: number) {
    return createCanvas(w, h);
  }
};
const engine = new NullEngine(),
  scene = new Scene(engine),
  rig = character(scene, true);
// Canvas-based flag lettering is used at runtime; the GLB uses the original stripe geometry only.
for (const m of scene.materials)
  if ("diffuseTexture" in m) (m as any).diffuseTexture = null;
function track(
  group: AnimationGroup,
  target: any,
  property: string,
  values: number[],
  frames = [0, 15, 30],
) {
  const a = new Animation(
    group.name + "-" + property,
    property,
    30,
    Animation.ANIMATIONTYPE_FLOAT,
    Animation.ANIMATIONLOOPMODE_CYCLE,
  );
  a.setKeys(values.map((value, i) => ({ frame: frames[i], value })));
  group.addTargetedAnimation(a, target);
}
const idle = new AnimationGroup("Idle", scene);
track(idle, rig.body, "position.y", [0, 0.025, 0]);
const walk = new AnimationGroup("Walk", scene);
track(walk, rig.legs[0], "rotation.x", [0.5, -0.5, 0.5]);
track(walk, rig.legs[1], "rotation.x", [-0.5, 0.5, -0.5]);
track(walk, rig.arms[0], "rotation.x", [-0.4, 0.4, -0.4]);
track(walk, rig.arms[1], "rotation.x", [0.4, -0.4, 0.4]);
const hit = new AnimationGroup("HitReaction", scene);
track(hit, rig.body, "rotation.x", [0, -0.8, 0]);
track(hit, rig.arms[0], "rotation.z", [0, -1, 0]);
track(hit, rig.arms[1], "rotation.z", [0, 1, 0]);
const fall = new AnimationGroup("Fall", scene);
track(fall, rig.legs[0], "rotation.x", [0, 0.7, 0.7]);
track(fall, rig.arms[0], "rotation.z", [0, -1.2, -1.2]);
track(fall, rig.arms[1], "rotation.z", [0, 1.2, 1.2]);
const data = await GLTF2Export.GLBAsync(scene, "official-original", {
  exportWithoutWaitingForScene: true,
});
const file = data.glTFFiles["official-original.glb"] as Blob;
await writeFile(
  "public/models/characters/official-original.glb",
  new Uint8Array(await file.arrayBuffer()),
);
scene.dispose();
engine.dispose();
console.log(
  "Exported original cartoon GLB with Idle, Walk, HitReaction and Fall.",
);
