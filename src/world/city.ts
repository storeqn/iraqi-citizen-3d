import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Meshes/instancedMesh";
import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { box, material, label, flag } from "./art";
import type { Obstacle } from "../gameplay/rules";
export function city(scene: Scene) {
  scene.clearColor.set(0.54, 0.76, 0.86, 1);
  scene.fogMode = Scene.FOGMODE_LINEAR;
  scene.fogStart = 35;
  scene.fogEnd = 95;
  scene.fogColor = new Color3(0.66, 0.79, 0.82);
  const ambient = new HemisphericLight("sky", new Vector3(0, 1, 0), scene);
  ambient.intensity = 0.85;
  ambient.groundColor = new Color3(0.5, 0.36, 0.24);
  const sun = new DirectionalLight("sun", new Vector3(-0.6, -1, 0.45), scene);
  sun.position.set(20, 35, -15);
  sun.intensity = 1.4;
  sun.diffuse = new Color3(1, 0.88, 0.7);
  const shadow = new ShadowGenerator(1024, sun);
  shadow.useBlurExponentialShadowMap = true;
  shadow.blurKernel = 16;
  const road = material(scene, "asphalt", "#687578"),
    sand = material(scene, "stone", "#d6c4a0"),
    trim = material(scene, "trim", "#f0dfb8"),
    glass = material(scene, "glass", "#385966"),
    dark = material(scene, "metal", "#35464a"),
    red = material(scene, "awning", "#ba5038"),
    yellow = material(scene, "taxi", "#edba39"),
    green = material(scene, "leaf", "#46764a");
  const ground = box(scene, "road", 0, -0.15, 0, 38, 0.3, 58, road);
  ground.receiveShadows = true;
  const obstacles: Obstacle[] = [];
  const solid = (
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat = trim,
  ) => {
    obstacles.push({ x, z, w, d });
    const m = box(scene, name, x, y, z, w, h, d, mat);
    m.checkCollisions = true;
    m.receiveShadows = true;
    return m;
  };
  for (const side of [-1, 1]) {
    box(
      scene,
      "sidewalk",
      side * 12,
      0.05,
      0,
      10,
      0.25,
      56,
      sand,
    ).receiveShadows = true;
    for (let z = -24; z <= 24; z += 4) {
      box(scene, "curb", side * 7, 0.13, z, 0.25, 0.28, 3.8, trim);
    }
    for (let z = -22, i = 0; z <= 22; z += 8, i++) {
      const x = side * 14,
        h = 6 + (i % 3) * 1.2;
      solid(
        "shop",
        x,
        h / 2,
        z,
        7,
        h,
        7,
        material(
          scene,
          "plaster" + i,
          ["#c8aa7f", "#d4bc91", "#bfa68e"][i % 3],
        ),
      );
      const sign = label(
        scene,
        [
          "سوق القرنة",
          "مطعم دجلة",
          "كوزمتك الأمير",
          "معرض الفردوس",
          "أبو علي للخضار",
          "مقهى النخيل",
        ][i],
        5,
        0.8,
      );
      sign.position.set(side * 10.45, 3, z);
      sign.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
      for (let k = -1; k <= 1; k++) {
        const m = box(
          scene,
          "window",
          side * 10.43,
          4.7,
          z + k * 1.8,
          0.06,
          1.25,
          1.1,
          glass,
        );
        box(
          scene,
          "lintel",
          side * 10.35,
          5.38,
          z + k * 1.8,
          0.14,
          0.12,
          1.3,
          trim,
        );
        m.receiveShadows = true;
      }
      box(scene, "shutter", side * 10.4, 1.3, z, 0.12, 2.25, 4.7, dark);
      box(scene, "awning", side * 9.6, 2.6, z, 1.8, 0.18, 5, red);
      for (let k = 0; k < 7; k++)
        box(
          scene,
          "awning-stripe",
          side * 9.6,
          2.7,
          z - 2.4 + k * 0.8,
          1.8,
          0.04,
          0.32,
          trim,
        );
      box(scene, "roof-cornice", x, h + 0.1, z, 7.3, 0.25, 7.3, trim);
      const f = flag(scene);
      f.position.set(side * 10.2, 5.8, z + 2);
      f.rotation.y = sign.rotation.y;
    }
  }
  for (let z = -23; z < 26; z += 5)
    box(scene, "road-marking", 0, 0.014, z, 0.14, 0.018, 2, trim);
  const palmRoot = new TransformNode("palm", scene);
  const trunk = MeshBuilder.CreateCylinder(
    "palm-trunk",
    { height: 5, diameterTop: 0.23, diameterBottom: 0.42, tessellation: 8 },
    scene,
  );
  trunk.parent = palmRoot;
  trunk.position.y = 2.5;
  trunk.material = material(scene, "bark", "#89734c");
  for (let i = 0; i < 9; i++) {
    const leaf = MeshBuilder.CreateCylinder(
      "palm-frond",
      { height: 3.2, diameterTop: 0.02, diameterBottom: 0.65, tessellation: 5 },
      scene,
    );
    leaf.parent = palmRoot;
    leaf.position.set(Math.sin(i * 0.7) * 0.8, 5, Math.cos(i * 0.7) * 0.8);
    leaf.rotation.set(0.9, 0, i * 0.7);
    leaf.material = green;
  }
  palmRoot.position.set(-8, 0, -17);
  obstacles.push({ x: -8, z: -17, w: 0.6, d: 0.6 });
  for (const [x, z] of [
    [8, -17],
    [-8, 0],
    [8, 0],
    [-8, 17],
    [8, 17],
  ]) {
    palmRoot.getChildMeshes().forEach((m) => {
      const inst = (m as Mesh).createInstance("palm-instance");
      inst.parent = null;
      inst.position = m
        .getAbsolutePosition()
        .add(new Vector3(x + 8, 0, z + 17));
      inst.rotation.copyFrom(m.rotation);
    });
    obstacles.push({ x, z, w: 0.6, d: 0.6 });
  }
  for (const [x, z] of [
    [5, -18],
    [-5, 15],
    [5, 20],
  ]) {
    solid("taxi", x, 0.65, z, 1.7, 1, 3.6, yellow);
    box(scene, "cabin", x, 1.4, z, 1.5, 0.65, 1.8, glass);
    box(scene, "taxi-roof", x, 1.76, z, 1.55, 0.13, 1.9, yellow);
    for (const dx of [-0.85, 0.85])
      for (const dz of [-1.1, 1.1]) {
        const wheel = MeshBuilder.CreateCylinder(
          "wheel",
          { diameter: 0.62, height: 0.2, tessellation: 12 },
          scene,
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x + dx, 0.33, z + dz);
        wheel.material = dark;
      }
    box(scene, "taxi-sign", x, 1.95, z, 0.5, 0.22, 0.3, trim);
  }
  for (const side of [-1, 1])
    for (const z of [-10, 10]) {
      solid("lamp", side * 7.6, 2.5, z, 0.15, 5, 0.15, dark);
      box(scene, "lamp-head", side * 7.2, 5, z, 1, 0.15, 0.35, trim);
    }
  for (const z of [-15, 15]) {
    solid("market-crate", -8.8, 0.45, z, 1.5, 0.9, 1, sand);
    for (let i = 0; i < 6; i++) {
      const fruit = MeshBuilder.CreateSphere(
        "produce",
        { diameter: 0.3, segments: 6 },
        scene,
      );
      fruit.position.set(
        -9.3 + (i % 3) * 0.4,
        1,
        z + Math.floor(i / 3) * 0.3 - 0.2,
      );
      fruit.material = i % 2 ? red : green;
    }
  }
  // Layered skyline and central arched landmark.
  for (let i = 0; i < 14; i++)
    box(
      scene,
      "skyline",
      -35 + i * 5,
      3 + (i % 4),
      34,
      4,
      6 + (i % 4) * 2,
      5,
      sand,
    );
  box(scene, "gate-left", -3, 4, 29, 3, 8, 2, sand);
  box(scene, "gate-right", 3, 4, 29, 3, 8, 2, sand);
  box(scene, "gate-top", 0, 8, 29, 9, 2, 2, trim);
  const title = label(scene, "أهلاً بالقرنة", 6, 1);
  title.position.set(0, 8, 27.95);
  title.rotation.y = Math.PI;
  for (const x of [-4, -2, 0, 2, 4])
    box(scene, "battlement", x, 9.3, 29, 0.8, 1, 2, trim);
  return { obstacles, shadow, sun };
}
