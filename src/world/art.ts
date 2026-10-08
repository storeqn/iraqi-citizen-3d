import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
export function material(scene: Scene, name: string, color: string) {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = Color3.FromHexString(color);
  m.specularColor = new Color3(0.06, 0.06, 0.06);
  return m;
}
export function box(
  scene: Scene,
  name: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  mat: StandardMaterial,
  parent?: TransformNode,
) {
  const m = MeshBuilder.CreateBox(
    name,
    { width: w, height: h, depth: d },
    scene,
  );
  m.position.set(x, y, z);
  m.material = mat;
  if (parent) m.parent = parent;
  return m;
}
export function label(
  scene: Scene,
  text: string,
  w = 3,
  h = 1,
  bg = "#f4e5c8",
  fg = "#492b20",
) {
  const t = new DynamicTexture(
    "arabic-" + text,
    { width: 1024, height: 512 },
    scene,
    false,
  );
  const ctx = t.getContext() as unknown as CanvasRenderingContext2D;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 512);
  ctx.font = "bold 95px Arial";
  ctx.textAlign = "center";
  ctx.direction = "rtl";
  ctx.fillStyle = fg;
  ctx.fillText(text, 512, 285);
  t.update();
  const m = new StandardMaterial("sign-" + text, scene);
  m.diffuseTexture = t;
  m.emissiveColor = new Color3(0.28, 0.28, 0.28);
  m.backFaceCulling = false;
  const p = MeshBuilder.CreatePlane("sign", { width: w, height: h }, scene);
  p.material = m;
  return p;
}
export function flag(scene: Scene, parent?: TransformNode) {
  const root = new TransformNode("iraqi-flag", scene);
  if (parent) root.parent = parent;
  const cols = ["#ce2d32", "#ffffff", "#192c2b"];
  cols.forEach((c, i) =>
    box(
      scene,
      "flag-stripe",
      0,
      0.15 - i * 0.15,
      0,
      0.7,
      0.15,
      0.025,
      material(scene, c, c),
      root,
    ),
  );
  const s = label(scene, "الله أكبر", 0.5, 0.13, "#ffffff", "#167748");
  s.parent = root;
  s.position.z = -0.017;
  return root;
}
export function sphere(
  scene: Scene,
  name: string,
  p: Vector3,
  scale: Vector3,
  mat: StandardMaterial,
  parent: TransformNode,
) {
  const m = MeshBuilder.CreateSphere(
    name,
    { diameter: 1, segments: 16 },
    scene,
  );
  m.position = p;
  m.scaling = scale;
  m.material = mat;
  m.parent = parent;
  return m;
}
