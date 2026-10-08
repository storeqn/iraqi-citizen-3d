import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { character, Character } from "../player/character";
import { box, label, material } from "../world/art";
export type Definition = {
  id: string;
  name?: string;
  model: string | null;
  reference?: string | null;
  scale?: number;
  rotationY?: number;
  animations?: Record<string, string>;
};
export class NPC {
  root: TransformNode;
  rig: Character;
  state: "appearing" | "idle" | "hit" = "appearing";
  age = 0;
  hitAge = 0;
  id: string;
  direction = new Vector3();
  animations: AnimationGroup[] = [];
  visual: TransformNode | null = null;
  disposed = false;
  constructor(
    public scene: Scene,
    p: Vector3,
    public def: Definition,
    serial: number,
  ) {
    this.id = def.id + "-" + serial;
    this.rig = character(scene, true);
    this.root = this.rig.root;
    this.root.position.copyFrom(p);
    this.rig.arms[0].rotation.x = -0.7;
    const pole = box(
      scene,
      "sign-pole",
      -0.65,
      1.9,
      0.1,
      0.07,
      2.5,
      0.07,
      material(scene, "wood", "#a77941"),
      this.root,
    );
    pole.rotation.z = 0.12;
    const sign = label(scene, "صعد الدولار!", 1.9, 1.05, "#fff0cc", "#d73128");
    sign.parent = this.root;
    sign.position.set(-0.7, 3.2, 0.1);
    sign.billboardMode = 2;
    const icon = label(scene, "$  ↗", 1.7, 0.45, "#fff0cc", "#367944");
    icon.parent = sign;
    icon.position.set(0, -0.31, -0.015);
    if (def.model) void this.loadModel(def.model);
  }
  async loadModel(url: string) {
    try {
      await import("@babylonjs/loaders/glTF");
      const assets = await SceneLoader.ImportMeshAsync(
        "",
        url.slice(0, url.lastIndexOf("/") + 1),
        url.slice(url.lastIndexOf("/") + 1),
        this.scene,
      );
      if (this.disposed) {
        assets.meshes.forEach((m) => m.dispose());
        assets.animationGroups.forEach((a) => a.dispose());
        return;
      }
      this.visual = new TransformNode("custom-model", this.scene);
      this.visual.parent = this.root;
      this.visual.scaling.setAll(this.def.scale ?? 1);
      this.visual.rotation.y = this.def.rotationY ?? 0;
      assets.meshes
        .filter((m) => !m.parent)
        .forEach((m) => (m.parent = this.visual));
      this.rig.body.setEnabled(false);
      this.animations = assets.animationGroups;
      for (const light of this.scene.lights) {
        const list = light.getShadowGenerator()?.getShadowMap()?.renderList;
        if (list) list.push(...assets.meshes);
      }
      this.play(this.state === "hit" ? "hit" : "idle");
    } catch {
      console.warn("GLB unavailable; using the playable original cartoon rig.");
    }
  }
  play(key: string) {
    this.animations.forEach((a) => a.stop());
    this.animations
      .find((a) => a.name === this.def.animations?.[key])
      ?.start(key === "idle" || key === "walk");
  }
  hit(dir: Vector3) {
    if (this.state !== "idle") return false;
    this.state = "hit";
    this.hitAge = 0;
    this.direction = dir.normalize();
    this.play("hit");
    return true;
  }
  update(dt: number, time: number, player: Vector3) {
    this.age += dt;
    if (this.state === "appearing") {
      const s = Math.min(1, this.age / 0.5);
      this.root.scaling.setAll(s);
      if (s === 1) this.state = "idle";
    }
    if (this.state === "idle") {
      this.root.rotation.y = Math.atan2(
        player.x - this.root.position.x,
        player.z - this.root.position.z,
      );
      this.rig.animate(time, false, false, 0);
      this.rig.arms[0].rotation.x = -1.3;
    } else if (this.state === "hit") {
      this.hitAge += dt;
      const t = this.hitAge;
      this.root.position.addInPlace(
        this.direction.scale(dt * 3 * Math.max(0, 1 - t / 1.5)),
      );
      this.root.position.y = Math.max(
        0.08,
        Math.sin(Math.min(1, t / 1.1) * Math.PI) * 1.8,
      );
      this.root.rotation.x = -Math.min(Math.PI * 2.5, t * 6);
      this.root.rotation.z = Math.sin(t * 10) * 0.2;
      if (t > 1.4) {
        this.root.position.y = 0.28;
        this.root.rotation.x = -Math.PI / 2;
        this.playFallOnce();
      }
      if (t > 2.3) this.root.scaling.setAll(Math.max(0, 1 - (t - 2.3) * 2));
      return t > 2.8;
    }
    return false;
  }
  private fallen = false;
  playFallOnce() {
    if (this.fallen) return;
    this.fallen = true;
    this.play("fall");
  }
  dispose() {
    this.disposed = true;
    this.animations.forEach((a) => a.dispose());
    this.root.dispose(false, true);
  }
}
