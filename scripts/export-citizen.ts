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
  rig = character(scene);
function track(
  g: AnimationGroup,
  target: any,
  property: string,
  values: number[],
  frames = [0, 15, 30],
) {
  const a = new Animation(
    g.name + "-" + property,
    property,
    30,
    Animation.ANIMATIONTYPE_FLOAT,
    Animation.ANIMATIONLOOPMODE_CYCLE,
  );
  a.setKeys(values.map((value, i) => ({ frame: frames[i], value })));
  g.addTargetedAnimation(a, target);
}
const idle = new AnimationGroup("Idle", scene);
track(idle, rig.body, "position.y", [0, 0.025, 0]);
for (const name of ["Walk", "Run"]) {
  const group = new AnimationGroup(name, scene),
    a = name === "Run" ? 0.8 : 0.4,
    frames = name === "Run" ? [0, 7, 14] : [0, 15, 30];
  track(group, rig.legs[0], "rotation.x", [a, -a, a], frames);
  track(group, rig.legs[1], "rotation.x", [-a, a, -a], frames);
  track(group, rig.arms[0], "rotation.x", [-a, a, -a], frames);
  track(group, rig.arms[1], "rotation.x", [a, -a, a], frames);
  track(group, rig.body, "position.y", [0, 0.04, 0], frames);
}
const jump = new AnimationGroup("Jump", scene);
track(jump, rig.legs[0], "rotation.x", [0, -0.5, 0]);
track(jump, rig.legs[1], "rotation.x", [0, 0.5, 0]);
const interact = new AnimationGroup("Interact", scene);
track(interact, rig.arms[1], "rotation.x", [0, -1, 0]);
const celebrate = new AnimationGroup("Celebrate", scene);
track(celebrate, rig.arms[0], "rotation.z", [-2, -2.5, -2]);
track(celebrate, rig.arms[1], "rotation.z", [2, 2.5, 2]);
track(celebrate, rig.body, "position.y", [0, 0.08, 0]);
const sad = new AnimationGroup("Sad", scene);
track(sad, rig.body, "rotation.x", [0.12, 0.2, 0.12]);
track(sad, rig.arms[0], "rotation.z", [-0.1, -0.2, -0.1]);
const data = await GLTF2Export.GLBAsync(scene, "citizen-original", {
  exportWithoutWaitingForScene: true,
});
await writeFile(
  "public/models/characters/citizen-original.glb",
  new Uint8Array(
    await (data.glTFFiles["citizen-original.glb"] as Blob).arrayBuffer(),
  ),
);
scene.dispose();
engine.dispose();
console.log(
  "Citizen GLB exported with seven original transform animation groups.",
);
