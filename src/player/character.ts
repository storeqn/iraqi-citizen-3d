import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { material, box, sphere, flag } from "../world/art";
export function character(scene: Scene, suit = false) {
  const root = new TransformNode(suit ? "official" : "citizen", scene),
    body = new TransformNode("body", scene);
  body.parent = root;
  const skin = material(scene, "skin", "#dba47c"),
    cloth = material(scene, "cloth", suit ? "#24354e" : "#f3f0e6"),
    pants = material(scene, "pants", suit ? "#1d2b43" : "#356787"),
    hair = material(scene, "hair", "#252627"),
    shoe = material(scene, "shoes", "#263033"),
    white = material(scene, "white", "#ffffff");
  sphere(
    scene,
    "torso",
    new Vector3(0, 1.2, 0),
    new Vector3(0.85, 0.94, 0.48),
    cloth,
    body,
  );
  sphere(
    scene,
    "head",
    new Vector3(0, 1.98, 0.01),
    new Vector3(0.67, 0.73, 0.61),
    skin,
    body,
  );
  sphere(
    scene,
    "hair",
    new Vector3(0, 2.2, -0.05),
    new Vector3(0.69, 0.39, 0.6),
    hair,
    body,
  );
  sphere(
    scene,
    "nose",
    new Vector3(0, 1.98, 0.32),
    new Vector3(0.14, 0.18, 0.15),
    skin,
    body,
  );
  for (const x of [-0.16, 0.16]) {
    sphere(
      scene,
      "eye",
      new Vector3(x, 2.07, 0.285),
      new Vector3(0.13, 0.09, 0.04),
      white,
      body,
    );
    sphere(
      scene,
      "pupil",
      new Vector3(x, 2.07, 0.308),
      new Vector3(0.06, 0.06, 0.035),
      hair,
      body,
    );
    box(scene, "eyebrow", x, 2.15, 0.3, 0.18, 0.045, 0.045, hair, body);
    sphere(
      scene,
      "ear",
      new Vector3(Math.sign(x) * 0.34, 1.98, 0),
      new Vector3(0.14, 0.22, 0.12),
      skin,
      body,
    );
  }
  box(scene, "mouth", 0, 1.8, 0.29, 0.22, 0.03, 0.03, hair, body);
  if (suit) {
    sphere(
      scene,
      "moustache",
      new Vector3(0, 1.89, 0.307),
      new Vector3(0.35, 0.09, 0.07),
      hair,
      body,
    );
    box(scene, "shirt", 0, 1.43, 0.244, 0.29, 0.52, 0.03, white, body);
    box(scene, "tie", 0, 1.4, 0.268, 0.095, 0.39, 0.03, pants, body);
    const f = flag(scene, body);
    f.scaling.setAll(0.16);
    f.position.set(-0.22, 1.46, 0.27);
  } else {
    sphere(
      scene,
      "hood",
      new Vector3(0, 1.55, -0.19),
      new Vector3(0.67, 0.34, 0.32),
      cloth,
      body,
    );
    for (const x of [-0.09, 0.09])
      box(scene, "hood-string", x, 1.45, 0.25, 0.02, 0.28, 0.02, white, body);
  }
  const arms = [-0.53, 0.53].map((x) => {
    const p = new TransformNode("arm", scene);
    p.parent = body;
    p.position.set(x, 1.55, 0);
    sphere(
      scene,
      "sleeve",
      new Vector3(0, -0.23, 0),
      new Vector3(0.25, 0.61, 0.28),
      cloth,
      p,
    );
    sphere(
      scene,
      "hand",
      new Vector3(0, -0.57, 0.02),
      new Vector3(0.24, 0.25, 0.25),
      skin,
      p,
    );
    return p;
  });
  const legs = [-0.21, 0.21].map((x) => {
    const p = new TransformNode("leg", scene);
    p.parent = body;
    p.position.set(x, 0.84, 0);
    sphere(
      scene,
      "trouser",
      new Vector3(0, -0.3, 0),
      new Vector3(0.29, 0.72, 0.32),
      pants,
      p,
    );
    sphere(
      scene,
      "sneaker",
      new Vector3(0, -0.69, 0.09),
      new Vector3(0.31, 0.19, 0.48),
      shoe,
      p,
    );
    if (!suit) box(scene, "sole", 0, -0.76, 0.09, 0.3, 0.045, 0.43, white, p);
    return p;
  });
  let motion = 0,
    pace = 8;
  return {
    root,
    body,
    arms,
    legs,
    animate(
      t: number,
      moving: boolean,
      run: boolean,
      punch: number,
      jump = false,
    ) {
      motion += ((moving ? 1 : 0) - motion) * 0.15;
      pace += ((run ? 12 : 8) - pace) * 0.1;
      const stride = Math.sin(t * pace) * (run ? 0.7 : 0.4) * motion;
      legs[0].rotation.x = stride;
      legs[1].rotation.x = -stride;
      if (jump) {
        legs[0].rotation.x = -0.4;
        legs[1].rotation.x = 0.4;
      }
      arms[0].rotation.x = -stride;
      arms[1].rotation.x =
        punch > 0 ? -Math.sin(punch * Math.PI) * 1.9 : stride;
      body.position.y = moving
        ? Math.abs(Math.sin(t * 8)) * 0.045
        : Math.sin(t * 2) * 0.018;
    },
    dispose() {
      root.dispose(false, true);
    },
  };
}
export type Character = ReturnType<typeof character>;
