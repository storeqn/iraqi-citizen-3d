import "@babylonjs/core/Collisions/collisionCoordinator";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Meshes/instancedMesh";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Ray } from "@babylonjs/core/Culling/ray";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { city } from "./world/city";
import { expansion, dollar } from "./world/expansion";
import { label, material } from "./world/art";
import { avatar } from "./player/avatar";
import { Input } from "./controls/input";
import { Audio } from "./core/audio";
import { Mission } from "./missions/session";
import { goods, destinations } from "./data/missions";
import { runnerItems, touching, laneX, RunItem } from "./minigames/runner";
import { clearPoint } from "./gameplay/rules";
import { loadProgress, saveProgress, complete, fresh } from "./utils/progress";
import {
  mount,
  show,
  txt,
  toast,
  progress,
  refreshMenu,
  drawChoices,
  money,
} from "./ui/ui";
import "./ui/style.css";
mount();
let saved = loadProgress();
const audio = new Audio();
audio.muted = saved.settings.muted;
refreshMenu(saved);
const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const fatal = (e: unknown) => {
  txt("fatalText", "تأكد من WebGL ومتصفح حديث. " + String(e));
  show("loading", false);
  show("fatal", true);
};
try {
  const engine = new Engine(canvas, true, {
    powerPreference: "high-performance",
    stencil: true,
  });
  void boot(engine).catch((e) => {
    engine.stopRenderLoop();
    fatal(e);
  });
} catch (e) {
  fatal(e);
}
async function boot(engine: Engine) {
  progress(10, "تمت تهيئة محرك WebGL");
  const scene = new Scene(engine);
  scene.collisionsEnabled = true;
  const world = city(scene);
  const extra = expansion(scene, world.obstacles);
  progress(38, "تم بناء المدينة والبسطات والبيت");
  const player = avatar(scene),
    enemy = dollar(scene);
  const camera = new FreeCamera("follow-camera", new Vector3(-5, 3, -3), scene);
  camera.inputs.clear();
  camera.minZ = 0.12;
  camera.maxZ = 110;
  camera.fov = 0.82;
  scene.activeCamera = camera;
  player.root.position.set(0, 0, -16);
  player.root.getChildMeshes().forEach((m) => world.shadow.addShadowCaster(m));
  const collider = MeshBuilder.CreateSphere(
    "collision-capsule",
    { diameter: 1 },
    scene,
  );
  collider.isVisible = false;
  collider.ellipsoid.set(0.4, 0.9, 0.4);
  collider.ellipsoidOffset.set(0, 0.9, 0);
  const input = new Input(canvas);
  let mission: Mission | null = null,
    paused = false,
    finished = false,
    time = 0,
    jump = 0,
    jumpV = 0,
    poseAge = 0,
    lastWave = 0,
    saveAge = 0,
    stepAge = 0,
    runner: RunItem[] = [],
    runnerMeshes: Map<string, Mesh> = new Map(),
    markers: { mesh: Mesh; id: string; x: number; z: number }[] = [],
    lastMap = 0,
    frameCount = 0;
  const choice = document.querySelector<HTMLDialogElement>("#choiceDialog")!;
  const qualitySelect = document.querySelector<HTMLSelectElement>("#quality")!,
    outfitSelect = document.querySelector<HTMLSelectElement>("#outfit")!;
  qualitySelect.value = saved.settings.quality;
  outfitSelect.value = saved.settings.outfit;
  function configure() {
    const q = saved.settings.quality,
      dpr = Math.min(
        window.devicePixelRatio || 1,
        q === "high" ? 1.75 : q === "medium" ? 1.2 : 0.8,
      );
    engine.setHardwareScalingLevel(1 / dpr);
    scene.shadowsEnabled = q !== "low";
    world.shadow.getShadowMap()!.resize(q === "high" ? 1024 : 512);
    extra.details.forEach((n) =>
      n
        .getChildMeshes()
        .filter((m) => m.name === "market-food")
        .forEach((m, i) => m.setEnabled(q !== "low" || i % 2 === 0)),
    );
    player.outfit(
      { white: "#f3f0e6", cream: "#ecd9b2", mint: "#bbd9c5" }[
        saved.settings.outfit
      ],
    );
    txt("mute", saved.settings.muted ? "الصوت مكتوم" : "الصوت يعمل");
    audio.muted = saved.settings.muted;
    saveProgress(saved);
  }
  configure();
  qualitySelect.addEventListener("change", () => {
    saved.settings.quality =
      qualitySelect.value as typeof saved.settings.quality;
    configure();
  });
  outfitSelect.addEventListener("change", () => {
    saved.settings.outfit = outfitSelect.value as typeof saved.settings.outfit;
    configure();
  });
  document.querySelector("#mute")!.addEventListener("click", () => {
    saved.settings.muted = !saved.settings.muted;
    audio.stop();
    configure();
  });
  document
    .querySelector("#resetAsk")!
    .addEventListener("click", () => show("resetConfirm", true));
  document.querySelector("#resetSave")!.addEventListener("click", () => {
    saved = fresh();
    saveProgress(saved);
    mission = null;
    paused = false;
    finished = false;
    show("paused", false);
    qualitySelect.value = "medium";
    outfitSelect.value = "white";
    configure();
    home();
    show("resetConfirm", false);
    toast("تم مسح تقدم اللعبة الجديدة");
  });
  function dialog(id: string) {
    document.querySelector<HTMLDialogElement>("#" + id)!.showModal();
    input.clear();
  }
  for (const name of ["settings", "results", "levels"])
    document.querySelector("#" + name)!.addEventListener("click", () => {
      refreshMenu(saved);
      dialog(name + "Dialog");
    });
  document
    .querySelector("#pauseSettings")!
    .addEventListener("click", () => dialog("settingsDialog"));
  document.querySelector("#stageCards")!.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-stage]",
    );
    if (b) {
      document.querySelector<HTMLDialogElement>("#levelsDialog")!.close();
      start(Number(b.dataset.stage));
    }
  });
  const coinMat = material(scene, "dinars", "#f5c448"),
    billMat = material(scene, "bill", "#e27459"),
    markerMat = material(scene, "interact-marker", "#7fc99c");
  coinMat.emissiveColor = new Color3(0.23, 0.13, 0.01);
  function cleanup() {
    markers.forEach((m) => {
      m.mesh.material?.dispose();
      m.mesh.dispose();
    });
    markers = [];
    runnerMeshes.forEach((m) => m.dispose());
    runnerMeshes.clear();
    runner = [];
  }
  function marker(id: string, name: string, x: number, z: number) {
    const sign = label(scene, name, 2.05, 0.65, "#ffefca", "#284e48");
    sign.position.set(x, 3.1, z);
    sign.billboardMode = 2;
    markers.push({ mesh: sign, id, x, z });
  }
  function saveSession() {
    if (mission && mission.status === "playing") {
      saved.resume = mission.snapshot();
      saveProgress(saved);
    }
  }
  function start(stage: number, resume = false) {
    cleanup();
    document
      .querySelectorAll("dialog[open]")
      .forEach((d) => (d as HTMLDialogElement).close());
    mission =
      resume && saved.resume
        ? Mission.restore(saved.resume)
        : new Mission(stage);
    paused = finished = false;
    jump = jumpV = poseAge = 0;
    lastWave = Math.floor(mission.elapsed / 22);
    player.root.rotation.set(0, 0, 0);
    player.root.position.set(0, 0, -17);
    input.yaw = 0;
    input.pitch = 0.35;
    input.clear();
    input.active = true;
    for (const id of ["menu", "end", "paused"]) show(id, false);
    show("hud", true);
    show("objective", true);
    show("controls", true);
    audio.unlock();
    if (mission.stage === 2) audio.say("صعد الدولار");
    if (mission.stage === 4) audio.say("الراتب بعده ثابت");
    if (mission.stage === 5) audio.tone("car");
    enemy.root.setEnabled(mission.stage === 2);
    if (mission.stage === 1) {
      for (const g of goods)
        if (!mission.selected.has(g.id))
          marker(g.id, g.name + " • " + money(mission.price(g.id)), g.x, g.z);
    } else if (mission.stage === 2) {
      runner = runnerItems();
      for (const item of runner) {
        item.taken =
          item.kind === "coin"
            ? mission.wallet.ledger.some((e) => e.id === item.id)
            : mission.selected.has(item.id);
        const mesh =
          item.kind === "coin"
            ? MeshBuilder.CreateCylinder(
                item.id,
                { height: 0.12, diameter: 0.65, tessellation: 12 },
                scene,
              )
            : MeshBuilder.CreateBox(
                item.id,
                { width: 1.3, height: 1.25, depth: 0.32 },
                scene,
              );
        mesh.material = item.kind === "coin" ? coinMat : billMat;
        mesh.setEnabled(!item.taken);
        runnerMeshes.set(item.id, mesh);
      }
      player.root.position.set(0, 0, -19);
    } else {
      const p = destinations[mission.stage];
      marker("destination", "✋ " + mission.config.place, p.x, p.z);
    }
    camera.position.copyFrom(
      player.root.position.add(new Vector3(0, 3.5, -6.6)),
    );
    camera.setTarget(player.root.position.add(new Vector3(0, 1.4, 0)));
    saveSession();
    toast(
      mission.stage === 1
        ? "اشتري الخمس مواد قبل موجة الغلاء!"
        : mission.stage === 2
          ? "غيّر المسار واقفز… اجمع 8 دنانير قبل خط النهاية!"
          : "روح إلى " + mission.config.place + " واضغط تفاعل",
    );
  }
  function home() {
    saveSession();
    cleanup();
    mission = null;
    paused = false;
    input.active = false;
    input.clear();
    show("menu", true);
    for (const id of [
      "end",
      "paused",
      "hud",
      "objective",
      "controls",
      "target",
    ])
      show(id, false);
    refreshMenu(saved);
    enemy.root.setEnabled(true);
  }
  function finish() {
    if (!mission || finished) return;
    finished = true;
    input.active = false;
    input.clear();
    choice.close();
    audio.stop();
    saved.resume = null;
    if (mission.status === "won") complete(saved, mission);
    else saveProgress(saved);
    txt("endBadge", mission.status === "won" ? "تحدي مكتمل ★" : "جرّب من جديد");
    txt(
      "endTitle",
      mission.status === "won" ? "دبّرتها يا مواطن!" : "الغلاء غلبك هالمرة",
    );
    txt("endMessage", mission.message);
    txt("finalScore", mission.score + " نقطة");
    txt("endBalance", "الرصيد المتبقي: " + money(mission.wallet.balance));
    show("next", mission.status === "won" && mission.stage < 8);
    show("end", true);
    show("controls", false);
    show("target", false);
    audio.tone(mission.status === "won" ? "win" : "lose");
    if (mission.status === "lost") audio.say("خلص الراتب وباقي الشهر");
    refreshMenu(saved);
  }
  function pause() {
    if (!mission || finished || paused) return;
    paused = true;
    input.active = false;
    input.clear();
    choice.close();
    saveSession();
    audio.stop();
    show("paused", true);
  }
  document.querySelector("#pause")!.addEventListener("click", pause);
  document.querySelector("#resume")!.addEventListener("click", () => {
    paused = false;
    show("paused", false);
    input.clear();
    input.active = true;
    audio.unlock();
  });
  document.querySelector("#quit")!.addEventListener("click", home);
  document.querySelector("#home")!.addEventListener("click", home);
  document.querySelector("#start")!.addEventListener("click", () => start(1));
  document.querySelector("#continue")!.addEventListener("click", () => {
    if (saved.resume) start(saved.resume.stage, true);
  });
  document.querySelector("#restart")!.addEventListener("click", () => {
    if (mission) start(mission.stage);
  });
  document.querySelector("#next")!.addEventListener("click", () => {
    if (mission && mission.stage < 8) start(mission.stage + 1);
  });
  document.querySelector("#share")!.addEventListener("click", () => {
    if (!mission) return;
    window.open(
      "https://wa.me/?text=" +
        encodeURIComponent(
          `المواطن ضد الغلاء 3D! نتيجتي في ${mission.config.title}: ${mission.score} نقطة. ${location.href.split("?")[0]}`,
        ),
      "_blank",
      "noopener,noreferrer",
    );
  });
  window.addEventListener("keydown", (e) => {
    if (e.code === "Escape" && !document.querySelector("dialog[open]")) pause();
  });
  window.addEventListener("blur", pause);
  window.addEventListener("pagehide", saveSession);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pause();
      engine.stopRenderLoop();
    } else engine.runRenderLoop(frame);
  });
  window.addEventListener("resize", () => engine.resize());
  choice.addEventListener("close", () => input.clear());
  document.querySelector("#choices")!.addEventListener("click", (e) => {
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-action]",
    );
    if (!button || button.disabled || !mission || paused || finished) return;
    const accepted = mission.choose(button.dataset.action!);
    if (!accepted) toast("الرصيد ما يكفي أو هذا الاختيار مستخدم");
    else {
      poseAge = 0.5;
      audio.tone("buy");
      saveSession();
      if (mission.message) toast(mission.message);
    }
    if (mission.status !== "playing") finish();
    else drawChoices(mission);
  });
  function nearest() {
    const p = player.root.position;
    return markers
      .filter((m) => mission?.stage !== 1 || !mission.selected.has(m.id))
      .sort(
        (a, b) =>
          Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z),
      )[0];
  }
  function interact() {
    if (!mission) return;
    if (mission.stage === 2) {
      toast("اجمع الدنانير وابتعد عن الفواتير — القفز ينفع!");
      return;
    }
    const near = nearest();
    if (
      !near ||
      Math.hypot(
        near.x - player.root.position.x,
        near.z - player.root.position.z,
      ) > 2.6
    ) {
      toast("اقترب من علامة التفاعل أولاً");
      return;
    }
    poseAge = 0.6;
    if (mission.stage === 1) {
      if (mission.buy(near.id)) {
        near.mesh.setEnabled(false);
        audio.tone("coin");
        toast("اشتريت " + goods.find((g) => g.id === near.id)!.name);
        saveSession();
      } else toast(mission.message);
      if (mission.status !== "playing") finish();
    } else {
      drawChoices(mission);
      dialog("choiceDialog");
    }
  }
  function objective() {
    if (!mission) return;
    if (mission.stage === 1)
      txt(
        "objective",
        `🛒 قائمة السوق: ${goods.map((g) => `${mission!.selected.has(g.id) ? "✓" : "○"} ${g.name}`).join(" • ")} | أسعار +${Math.round((mission.inflation - 1) * 100)}%`,
      );
    else if (mission.stage === 2)
      txt(
        "objective",
        `💸 ${Math.floor(mission.distance)}/160 متر • ${mission.coins}/8 دنانير • قلوب ${"♥".repeat(Math.max(0, 3 - mission.hits))} | غيّر المسار واقفز فوق الفواتير`,
      );
    else
      txt(
        "objective",
        mission.config.title +
          " • " +
          mission.config.subtitle +
          " | اقترب من علامة " +
          mission.config.place +
          " واضغط تفاعل",
      );
  }
  const mapCanvas = document.querySelector<HTMLCanvasElement>("#map")!,
    ctx = mapCanvas.getContext("2d")!;
  function map() {
    ctx.clearRect(0, 0, 130, 130);
    ctx.fillStyle = "#dec49b";
    ctx.fillRect(0, 0, 130, 130);
    ctx.fillStyle = "#7a8c8d";
    ctx.fillRect(43, 0, 44, 130);
    ctx.fillStyle = "#ab8a65";
    for (const o of world.obstacles)
      ctx.fillRect(65 + o.x * 2 - o.w, 65 - o.z * 2 - o.d, o.w * 2, o.d * 2);
    ctx.fillStyle = "#5dc697";
    markers
      .filter((m) => m.mesh.isEnabled())
      .forEach((m) => {
        ctx.beginPath();
        ctx.arc(65 + m.x * 2, 65 - m.z * 2, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    ctx.fillStyle = "#ffc94c";
    ctx.beginPath();
    ctx.arc(
      65 + player.root.position.x * 2,
      65 - player.root.position.z * 2,
      4,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  const runnerOrigin = -19,
    span = 40;
  function updateRun(dt: number, mv: { x: number; z: number; run: boolean }) {
    if (!mission) return;
    mission.run(dt);
    player.root.position.x = Math.max(
      -3.5,
      Math.min(3.5, player.root.position.x + mv.x * dt * 5.5),
    );
    const previousZ = player.root.position.z;
    const z = runnerOrigin + (mission.distance % span);
    if (Math.abs(z - previousZ) > 20) camera.position.z += z - previousZ;
    player.root.position.z = z;
    player.root.rotation.y = 0;
    for (const item of runner) {
      const mesh = runnerMeshes.get(item.id)!;
      const delta = item.distance - mission.distance;
      mesh.position.set(
        laneX(item.lane),
        item.kind === "coin" ? 1.1 : 0.65,
        z + delta,
      );
      mesh.setEnabled(!item.taken && delta > -2 && delta < 28);
      if (item.kind === "coin") mesh.rotation.z = time * 2;
      if (touching(item, mission.distance, player.root.position.x, jump)) {
        item.taken = true;
        mesh.setEnabled(false);
        if (item.kind === "coin") {
          mission.collect(item.id);
          audio.tone("coin");
        } else {
          mission.collision(item.id);
          audio.tone("lose");
          toast("فاتورة مفاجئة! ارفع رجلك واقفز");
        }
      }
    }
    enemy.root.position.set(Math.sin(time * 0.7) * 2, 0, z + 6);
    enemy.root.rotation.y = Math.PI;
    enemy.animate(time);
    if (mission.status !== "playing") finish();
  }
  function frame() {
    try {
      const dt = Math.min(0.05, engine.getDeltaTime() / 1000);
      time += dt;
      frameCount++;
      const modal = !!document.querySelector("dialog[open]");
      let moving = false,
        running = false,
        pose: "interact" | "celebrate" | "sad" | null = null;
      if (mission) {
        if (!paused && !finished && !modal) {
          input.active = true;
          mission.tick(dt);
          const mv = input.movement(),
            l = Math.hypot(mv.x, mv.z);
          running = mv.run;
          moving = l > 0.08;
          if (input.consume("jump") && jump === 0) {
            jumpV = 6;
            audio.tone("jump");
          }
          jumpV -= dt * 17;
          jump = Math.max(0, jump + jumpV * dt);
          if (!jump) jumpV = 0;
          player.root.position.y = jump;
          if (mission.stage === 2) {
            moving = running = true;
            input.yaw = 0;
            updateRun(dt, mv);
          } else if (moving) {
            const angle = Math.atan2(mv.x, mv.z) + input.yaw,
              dir = new Vector3(Math.sin(angle), 0, Math.cos(angle)),
              speed = (running ? 5.7 : 3.5) * Math.min(l, 1);
            const proposed = player.root.position.add(dir.scale(dt * speed));
            if (clearPoint(proposed, world.obstacles, 0.42)) {
              collider.position.set(
                player.root.position.x,
                0,
                player.root.position.z,
              );
              collider.moveWithCollisions(dir.scale(dt * speed));
              player.root.position.x = collider.position.x;
              player.root.position.z = collider.position.z;
            }
            player.root.rotation.y = angle;
          }
          if (input.consume("interact")) interact();
          poseAge = Math.max(0, poseAge - dt);
          if (poseAge > 0) pose = "interact";
          stepAge += dt;
          if (moving && jump === 0 && stepAge > 0.3) {
            stepAge = 0;
            audio.tone("step");
          }
          if (
            mission.stage === 1 &&
            Math.floor(mission.elapsed / 22) > lastWave
          ) {
            lastWave = Math.floor(mission.elapsed / 22);
            toast("↗ موجة غلاء افتراضية! ولك شنو هالأسعار؟");
            audio.say("ولك شنو هالأسعار");
            for (const mark of markers.filter(
              (m) => !mission!.selected.has(m.id),
            )) {
              const g = goods.find((g) => g.id === mark.id)!;
              mark.mesh.material?.dispose();
              mark.mesh.dispose();
              const freshSign = label(
                scene,
                g.name + " • " + money(mission.price(g.id)) + " ↗",
                2.05,
                0.65,
                "#ffefca",
                "#c44934",
              );
              freshSign.position.set(mark.x, 3.1, mark.z);
              freshSign.billboardMode = 2;
              mark.mesh = freshSign;
            }
          }
          saveAge += dt;
          if (saveAge > 2) {
            saveAge = 0;
            saveSession();
          }
          if (mission.status !== "playing") finish();
        } else {
          input.active = false;
          input.clear();
        }
        if (finished) pose = mission.status === "won" ? "celebrate" : "sad";
        player.animate(time, moving, running, jump > 0, pose);
        txt("balance", money(mission.wallet.balance));
        txt("score", mission.score + " نقطة");
        txt("time", Math.ceil(mission.remaining));
        objective();
        if (!finished && !paused && !modal && mission.stage !== 2) {
          const near = nearest();
          if (near) {
            const d = Math.hypot(
              near.x - player.root.position.x,
              near.z - player.root.position.z,
            );
            show("target", true);
            txt(
              "target",
              d <= 2.6
                ? "✋ تفاعل E"
                : "↗ " +
                    Math.round(d) +
                    " متر إلى " +
                    (mission.stage === 1
                      ? goods.find((g) => g.id === near.id)!.name
                      : mission.config.place),
            );
          } else show("target", false);
        } else show("target", false);
        lastMap += dt;
        if (lastMap > 0.2) {
          lastMap = 0;
          map();
        }
      } else {
        player.root.position.set(-0.6, 0, -9 + Math.sin(time * 0.18) * 4);
        player.root.rotation.y = 0;
        player.animate(time, true, true, false, null);
        enemy.root.position.set(0.6, 0, player.root.position.z - 2.7);
        enemy.root.rotation.y = 0;
        enemy.animate(time);
      }
      const focus = player.root.position.add(new Vector3(0, 1.4, 0)),
        offset = mission
          ? new Vector3(
              -Math.sin(input.yaw) * 6.6,
              2.2 + input.pitch * 2.8,
              -Math.cos(input.yaw) * 6.6,
            )
          : new Vector3(-5.8, 2.5, 5.5);
      const ray = new Ray(focus, offset.normalizeToNew(), offset.length()),
        hit = scene.pickWithRay(
          ray,
          (m) => m.checkCollisions && m !== collider,
        );
      let desired = focus.add(offset);
      if (hit?.hit && hit.pickedPoint)
        desired = hit.pickedPoint.subtract(ray.direction.scale(0.35));
      camera.position = Vector3.Lerp(
        camera.position,
        desired,
        Math.min(1, dt * 8),
      );
      camera.setTarget(focus);
      if (saved.settings.quality !== "high" && frameCount % 15 === 0) {
        for (const detail of extra.details) {
          const distant =
            Vector3.Distance(detail.position, player.root.position) > 30;
          detail
            .getChildMeshes()
            .filter((m) => m.name === "market-food")
            .forEach((m, i) =>
              m.setEnabled(
                !distant && (saved.settings.quality !== "low" || i % 2 === 0),
              ),
            );
        }
      }
      scene.render();
    } catch (e) {
      engine.stopRenderLoop();
      fatal(e);
    }
  }
  engine.runRenderLoop(frame);
  progress(58, "الشخصيات والتحكم جاهزة");
  try {
    await player.load((loaded, total) => {
      if (total > 0)
        progress(
          58 + Math.min(20, (loaded / total) * 20),
          "تحميل نموذج المواطن GLB",
        );
      else
        txt(
          "loadText",
          "تحميل نموذج المواطن: " + Math.round(loaded / 1024) + " KB",
        );
    });
    progress(82, "تم تحميل نموذج المواطن وحركاته");
  } catch {
    progress(82, "نموذج احتياطي جاهز");
    toast("تعذر تحميل GLB؛ الشخصية الأصلية الاحتياطية تعمل");
  }
  configure();
  await scene.whenReadyAsync();
  progress(100, "المشهد والخامات جاهزة");
  show("loading", false);
  show("menu", true);
}
