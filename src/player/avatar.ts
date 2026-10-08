import { Scene } from "@babylonjs/core/scene";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { character } from "./character";
export function avatar(scene: Scene) {
  const rig = character(scene);
  let groups: AnimationGroup[] = [],
    active = "";
  return {
    rig,
    root: rig.root,
    async load(onProgress: (loaded: number, total: number) => void) {
      await import("@babylonjs/loaders/glTF");
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "./models/characters/",
        "citizen-original.glb",
        scene,
        (e) => onProgress(e.loaded, e.total),
      );
      const importedRoot = result.meshes.filter((m) => !m.parent);
      importedRoot.forEach((m) => (m.parent = rig.root));
      rig.body.setEnabled(false);
      groups = result.animationGroups;
      result.meshes.forEach((m) =>
        scene.lights.forEach((l) =>
          l.getShadowGenerator()?.getShadowMap()?.renderList?.push(m),
        ),
      );
      return result;
    },
    outfit(color: string) {
      const c = Color3.FromHexString(color);
      for (const mat of scene.materials.filter((m) =>
        m.name.startsWith("cloth"),
      )) {
        if ("diffuseColor" in mat) (mat as any).diffuseColor = c;
        if ("albedoColor" in mat) (mat as any).albedoColor = c;
      }
    },
    animate(
      t: number,
      moving: boolean,
      run: boolean,
      jump: boolean,
      pose: "interact" | "celebrate" | "sad" | null,
    ) {
      const name =
        pose === "celebrate"
          ? "Celebrate"
          : pose === "sad"
            ? "Sad"
            : pose === "interact"
              ? "Interact"
              : jump
                ? "Jump"
                : moving
                  ? run
                    ? "Run"
                    : "Walk"
                  : "Idle";
      if (groups.length) {
        if (name !== active) {
          groups.forEach((g) => g.stop());
          groups.find((g) => g.name === name)?.start(name !== "Jump");
          active = name;
        }
      } else {
        rig.resetPose();
        rig.animate(t, moving, run, -1, jump);
        if (pose) rig.pose(pose, t);
      }
    },
  };
}
