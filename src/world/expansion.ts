import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { box, label, material, sphere } from "./art";
import { goods, destinations } from "../data/missions";
import type { Obstacle } from "../gameplay/rules";
export function expansion(scene: Scene, obstacles: Obstacle[]) {
  const wood = material(scene, "fresh-wood", "#b68b53"),
    cream = material(scene, "cream", "#f3dfaf"),
    red = material(scene, "tomato", "#dd6045"),
    green = material(scene, "fresh-green", "#79a456"),
    yellow = material(scene, "produce-yellow", "#edc64e"),
    blue = material(scene, "stall-blue", "#508d99");
  const details: TransformNode[] = [];
  for (const g of goods) {
    const x = g.x + (g.x < 0 ? -1.25 : 1.25),
      z = g.z;
    const root = new TransformNode("stall-" + g.id, scene);
    root.position.set(x, 0, z);
    box(scene, "counter", 0, 0.65, 0, 1.4, 1.3, 2, wood, root);
    obstacles.push({ x, z, w: 1.4, d: 2 });
    for (const dz of [-0.85, 0.85])
      for (const dx of [-0.55, 0.55])
        box(
          scene,
          "stall-support",
          dx,
          1.45,
          dz,
          0.065,
          2.9,
          0.065,
          wood,
          root,
        );
    box(
      scene,
      "canopy",
      0,
      2.75,
      0,
      2.1,
      0.16,
      2.4,
      g.id === "bread" ? yellow : blue,
      root,
    );
    const sign = label(scene, g.name, 1.6, 0.55, "#ffefce", "#324c44");
    sign.parent = root;
    sign.position.set(g.x < 0 ? 0.72 : -0.72, 2, 0);
    sign.rotation.y = g.x < 0 ? -Math.PI / 2 : Math.PI / 2;
    for (let i = 0; i < 12; i++) {
      const food = sphere(
        scene,
        "market-food",
        new Vector3((i % 3) * 0.32 - 0.3, 1.4, Math.floor(i / 3) * 0.35 - 0.52),
        new Vector3(0.28, 0.23, 0.28),
        i % 3 === 0 ? red : i % 3 === 1 ? green : yellow,
        root,
      );
      const lod = MeshBuilder.CreateSphere(
        "food-lod",
        { diameter: 1, segments: 4 },
        scene,
      );
      lod.material = food.material;
      (food as Mesh).addLODLevel(18, lod).addLODLevel(32, null);
    }
    details.push(root);
  }
  for (const [id, text] of [
    [3, "دائرة الخدمات"],
    [4, "مصرف الراتب"],
    [5, "موقف التكاسي"],
    [6, "آخر سعر!"],
    [8, "تحديات الحياة"],
  ] as const) {
    const p = destinations[id],
      board = label(scene, text, 2.1, 0.65, "#f5e8c9", "#264850");
    board.position.set(p.x, 2.4, p.z);
    board.billboardMode = 2;
    box(scene, "information-pole", p.x, 1.1, p.z, 0.08, 2.2, 0.08, wood);
  }
  // A walk-in, open-front living room at the end of the street.
  const home = new TransformNode("living-room", scene);
  box(scene, "living-floor", 0, 0.05, 24, 10, 0.16, 5, cream, home);
  const wall = box(
    scene,
    "home-back",
    0,
    1.9,
    26.5,
    10,
    3.8,
    0.22,
    material(scene, "wall-peach", "#d1a988"),
    home,
  );
  wall.checkCollisions = true;
  obstacles.push({ x: 0, z: 26.5, w: 10, d: 0.22 });
  for (const x of [-5, 5]) {
    const side = box(scene, "home-side", x, 1.9, 24, 0.2, 3.8, 5, cream, home);
    side.checkCollisions = true;
    obstacles.push({ x, z: 24, w: 0.2, d: 5 });
  }
  box(scene, "couch-seat", -2.8, 0.45, 25, 2.8, 0.55, 1.2, blue, home);
  box(scene, "couch-back", -2.8, 1, 25.5, 2.8, 1, 0.22, blue, home);
  for (const x of [-4.1, -1.5])
    box(scene, "couch-arm", x, 0.8, 25, 0.28, 0.9, 1.2, blue, home);
  obstacles.push({ x: -2.8, z: 25, w: 2.8, d: 1.2 });
  box(scene, "coffee-table", 0, 0.5, 24.5, 1.5, 0.1, 1.1, wood, home);
  for (const x of [-0.6, 0.6])
    box(scene, "table-leg", x, 0.25, 24.5, 0.09, 0.5, 0.09, wood, home);
  obstacles.push({ x: 0, z: 24.5, w: 1.5, d: 1.1 });
  box(
    scene,
    "television",
    1.8,
    1.9,
    26.2,
    2,
    0.95,
    0.16,
    material(scene, "tv-dark", "#243741"),
    home,
  );
  const news = label(scene, "الراتب ثابت!", 1.75, 0.75, "#315b64", "#fff4d4");
  news.position.set(1.8, 1.9, 26.1);
  const homeSign = label(scene, "بيت المواطن", 3, 0.6, "#f3dfaf", "#71533d");
  homeSign.position.set(0, 3.5, 22);
  details.push(home);
  const rug = box(
    scene,
    "rug",
    0,
    0.15,
    23,
    4,
    0.025,
    1.5,
    material(scene, "rug", "#b85440"),
    home,
  );
  return { details, rug };
}
export function dollar(scene: Scene) {
  const root = new TransformNode("fictional-dollar", scene),
    body = material(scene, "dollar-green", "#82b976"),
    edge = material(scene, "dollar-edge", "#cee1a2"),
    ink = material(scene, "dollar-ink", "#26524a"),
    white = material(scene, "dollar-white", "#fff8e0");
  box(scene, "dollar-body", 0, 1.3, 0, 1.25, 1.65, 0.25, body, root);
  for (const x of [-0.6, 0.6])
    box(scene, "bill-border", x, 1.3, 0.14, 0.05, 1.57, 0.025, edge, root);
  for (const y of [0.5, 2.1])
    box(scene, "bill-border", 0, y, 0.14, 1.2, 0.05, 0.025, edge, root);
  const emblem = label(scene, "$", 0.6, 0.55, "#82b976", "#27584b");
  emblem.parent = root;
  emblem.position.set(0, 1.3, 0.15);
  emblem.rotation.y = Math.PI;
  for (const x of [-0.28, 0.28]) {
    sphere(
      scene,
      "dollar-eye",
      new Vector3(x, 1.85, 0.17),
      new Vector3(0.25, 0.28, 0.09),
      white,
      root,
    );
    sphere(
      scene,
      "dollar-pupil",
      new Vector3(x, 1.83, 0.22),
      new Vector3(0.09, 0.13, 0.05),
      ink,
      root,
    );
  }
  const legs = [-0.4, 0.4].map((x) => {
    const p = new TransformNode("dollar-leg", scene);
    p.parent = root;
    p.position.set(x, 0.5, 0);
    box(scene, "leg", 0, -0.23, 0, 0.1, 0.45, 0.1, ink, p);
    sphere(
      scene,
      "sneaker",
      new Vector3(0, -0.43, 0.1),
      new Vector3(0.32, 0.17, 0.42),
      white,
      p,
    );
    return p;
  });
  for (const x of [-0.8, 0.8])
    box(scene, "dollar-arm", x, 1.15, 0, 0.35, 0.1, 0.12, ink, root);
  return {
    root,
    animate(t: number) {
      legs[0].rotation.x = Math.sin(t * 12) * 0.8;
      legs[1].rotation.x = -Math.sin(t * 12) * 0.8;
      root.position.y = Math.abs(Math.sin(t * 12)) * 0.08;
    },
  };
}
