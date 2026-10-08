import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
const $ = (id) => document.getElementById(id);
let pictureURL, modelURL, scene, engine;
try {
  engine = new Engine($("preview"), true);
  scene = new Scene(engine);
  new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  const camera = new ArcRotateCamera(
    "camera",
    -0.8,
    1.2,
    5,
    new Vector3(0, 1, 0),
    scene,
  );
  camera.attachControl($("preview"), true);
  engine.runRenderLoop(() => scene.render());
  window.addEventListener("resize", () => engine.resize());
} catch (e) {
  $("status").textContent = "تعذرت المعاينة: " + e.message;
}
$("reference").onchange = () => {
  if (pictureURL) URL.revokeObjectURL(pictureURL);
  const f = $("reference").files[0];
  if (!f) return;
  pictureURL = URL.createObjectURL(f);
  $("photo").src = pictureURL;
  $("photo").hidden = false;
};
$("model").onchange = async () => {
  const f = $("model").files[0];
  if (!f || !scene) return;
  if (f.size > 20 * 1024 * 1024) {
    $("status").textContent = "الملف أكبر من 20MB";
    return;
  }
  scene.meshes.slice().forEach((m) => m.dispose());
  scene.animationGroups.slice().forEach((a) => a.dispose());
  if (modelURL) URL.revokeObjectURL(modelURL);
  modelURL = URL.createObjectURL(f);
  try {
    await import("@babylonjs/loaders/glTF");
    const result = await SceneLoader.ImportMeshAsync(
      "",
      "",
      modelURL,
      scene,
      undefined,
      ".glb",
    );
    result.animationGroups[0]?.start(true);
    $("status").textContent =
      "تم تحميل النموذج. الحركات: " +
      result.animationGroups.map((a) => a.name).join(", ");
  } catch (e) {
    $("status").textContent = "تعذر تحميل GLB: " + e.message;
  }
};
$("export").onclick = () => {
  const id = $("id").value.trim();
  if (!/^[a-z0-9-]+$/.test(id)) {
    alert("استخدم معرفاً من أحرف إنجليزية صغيرة وأرقام وشرطة");
    return;
  }
  const model = $("model").files[0],
    ref = $("reference").files[0],
    definition = {
      id,
      name: $("name").value,
      model: model ? "./models/characters/" + model.name : null,
      reference: ref ? "./textures/" + ref.name : null,
      scale: 1,
      rotationY: 0,
      animations: {
        idle: "Idle",
        walk: "Walk",
        hit: "HitReaction",
        fall: "Fall",
      },
    };
  const text = JSON.stringify(definition, null, 2);
  $("json").textContent = text;
  const url = URL.createObjectURL(
      new Blob([text], { type: "application/json" }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = id + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
