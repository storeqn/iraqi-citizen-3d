import "@babylonjs/core/Collisions/collisionCoordinator";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Meshes/instancedMesh";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Ray } from "@babylonjs/core/Culling/ray";
import { mount, show, txt, toast } from "./ui/ui";
import "./ui/style.css";
import { city } from "./world/city";
import { character } from "./player/character";
import { Input } from "./controls/input";
import { Round, spawnPoint, clearPoint, canHit } from "./gameplay/rules";
import { readSave, writeSave } from "./utils/save";
import { Audio } from "./core/audio";
import { NPC, Definition } from "./npc/npc";
mount();
const save = readSave(),
  audio = new Audio();
audio.muted = save.muted;
txt("best", save.best);
txt("mute", save.muted ? "الصوت: مكتوم" : "الصوت: يعمل");
const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
let engine: Engine;
try {
  engine = new Engine(canvas, true, {
    preserveDrawingBuffer: false,
    stencil: true,
    powerPreference: "high-performance",
  });
  boot(engine);
} catch (e) {
  show("loading", false);
  txt("fatalText", "تأكد من تفعيل WebGL واستعمال متصفح حديث. " + String(e));
  show("fatal", true);
}
function boot(engine: Engine) {
  const scene = new Scene(engine);
  scene.collisionsEnabled = true;
  const world = city(scene);
  const player = character(scene);
  player.root.position.set(0, 0, -5);
  player.root.getChildMeshes().forEach((m) => world.shadow.addShadowCaster(m));
  const collider = MeshBuilder.CreateSphere(
    "player-collider",
    { diameter: 1 },
    scene,
  );
  collider.isVisible = false;
  collider.ellipsoid.set(0.38, 0.8, 0.38);
  collider.ellipsoidOffset.set(0, 0.85, 0);
  collider.position.copyFrom(player.root.position);
  const camera = new FreeCamera("third-person", new Vector3(0, 4, -10), scene);
  camera.minZ = 0.15;
  camera.maxZ = 110;
  camera.fov = 0.88;
  camera.inputs.clear();
  scene.activeCamera = camera;
  const input = new Input(canvas),
    round = new Round();
  let paused = false,
    started = false,
    ended = false,
    time = 0,
    jumpV = 0,
    jumpY = 0,
    punchAge = -1,
    cooldown = 0,
    nextSpawn = 0,
    serial = 0,
    npcs: NPC[] = [],
    peakCombo = 0;
  let definitions: Definition[] = [
    { id: "official-01", name: "أبو الدولار", model: null },
  ];
  void fetch("./characters.json")
    .then((r) => {
      if (!r.ok) throw Error("characters");
      return r.json();
    })
    .then((d) => {
      if (Array.isArray(d) && d.length)
        definitions = d.filter(
          (x) =>
            typeof x.id === "string" &&
            (!x.model || typeof x.model === "string"),
        );
      if (!definitions.length)
        definitions = [{ id: "official-01", model: null }];
    })
    .catch(() => toast("تعذر تحميل تعريف الشخصيات؛ النموذج الأساسي جاهز"));
  const settings = document.querySelector<HTMLSelectElement>("#quality")!;
  settings.value = save.quality;
  function quality() {
    save.quality = settings.value as typeof save.quality;
    const q = save.quality;
    engine.setHardwareScalingLevel(
      q === "low"
        ? 2
        : q === "medium"
          ? Math.max(1, window.devicePixelRatio / 1.4)
          : Math.max(0.7, 1 / window.devicePixelRatio),
    );
    world.sun.shadowEnabled = q !== "low";
    world.shadow.getShadowMap()!.resize(q === "high" ? 1024 : 512);
    scene.shadowsEnabled = q !== "low";
    writeSave(save);
  }
  quality();
  settings.addEventListener("change", quality);
  document.querySelector("#mute")!.addEventListener("click", () => {
    save.muted = !save.muted;
    audio.muted = save.muted;
    audio.stop();
    writeSave(save);
    txt("mute", save.muted ? "الصوت: مكتوم" : "الصوت: يعمل");
  });
  document.querySelector("#resetSave")!.addEventListener("click", () => {
    save.best = 0;
    save.muted = false;
    settings.value = "medium";
    audio.muted = false;
    quality();
    txt("best", 0);
    txt("mute", "الصوت: يعمل");
    toast("تمت إعادة الضبط");
  });
  function start() {
    audio.unlock();
    audio.stop();
    npcs.forEach((n) => n.dispose());
    npcs = [];
    effects.forEach((e) => e.mesh.dispose());
    effects = [];
    round.reset();
    started = true;
    ended = false;
    paused = false;
    peakCombo = 0;
    time = 0;
    cooldown = 0;
    punchAge = -1;
    jumpV = jumpY = 0;
    nextSpawn = 0.8;
    player.root.position.set(0, 0, -5);
    player.root.rotation.set(0, 0, 0);
    collider.position.copyFrom(player.root.position);
    input.clear();
    input.yaw = 0;
    input.pitch = 0.42;
    input.active = true;
    for (const id of ["menu", "end", "paused"]) show(id, false);
    show("hud", true);
    show("controls", true);
    toast("الراتب ثابت… خل نشوف السوق!");
  }
  function finish() {
    if (ended) return;
    ended = true;
    round.running = false;
    input.active = false;
    input.clear();
    audio.stop();
    save.best = Math.max(save.best, round.score);
    writeSave(save);
    txt("best", save.best);
    txt("finalScore", round.score);
    txt("finalCombo", `أعلى تتابع: ${peakCombo} • أعلى نتيجة: ${save.best}`);
    show("end", true);
    show("paused", false);
    show("controls", false);
    show("target", false);
  }
  function pause() {
    if (!round.running || ended) return;
    paused = true;
    input.active = false;
    input.clear();
    audio.stop();
    show("paused", true);
  }
  document.querySelector("#pause")!.addEventListener("click", pause);
  document.querySelector("#resume")!.addEventListener("click", () => {
    paused = false;
    input.clear();
    input.active = true;
    audio.unlock();
    show("paused", false);
  });
  document.querySelector("#quit")!.addEventListener("click", finish);
  for (const id of ["start", "restart"])
    document.querySelector("#" + id)!.addEventListener("click", start);
  document.querySelector("#home")!.addEventListener("click", () => {
    started = false;
    show("end", false);
    show("menu", true);
    show("hud", false);
    show("target", false);
  });
  document.querySelector("#share")!.addEventListener("click", () => {
    const url = new URL(location.href);
    url.search = "";
    url.hash = "";
    window.open(
      "https://wa.me/?text=" +
        encodeURIComponent(
          `جمعت ${round.score} نقطة في يوميات مواطن عراقي 3D 😅 صعد الدولار! جرّب اللعبة: ${url.href}`,
        ),
      "_blank",
      "noopener,noreferrer",
    );
  });
  window.addEventListener("blur", pause);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pause();
      engine.stopRenderLoop();
    } else engine.runRenderLoop(frame);
  });
  window.addEventListener("resize", () => engine.resize());
  let effects: {
    mesh: ReturnType<typeof MeshBuilder.CreateSphere>;
    velocity: Vector3;
    life: number;
    max: number;
  }[] = [];
  function impact(p: Vector3) {
    for (let i = 0; i < 18; i++) {
      const star = i < 7,
        m = star
          ? MeshBuilder.CreatePolyhedron(
              "comic-star",
              { type: 1, size: 0.16 },
              scene,
            )
          : MeshBuilder.CreateSphere(
              "dust",
              { diameter: 0.23, segments: 5 },
              scene,
            );
      const mat = new StandardMaterial("fx", scene);
      mat.diffuseColor = star
        ? new Color3(1, 0.77, 0.14)
        : new Color3(0.75, 0.66, 0.51);
      mat.emissiveColor = star ? new Color3(0.5, 0.28, 0) : Color3.Black();
      m.material = mat;
      m.position.copyFrom(p);
      effects.push({
        mesh: m,
        velocity: new Vector3(
          (Math.random() - 0.5) * 4,
          Math.random() * 3,
          (Math.random() - 0.5) * 4,
        ),
        life: 0.7 + Math.random() * 0.6,
        max: 1.3,
      });
    }
  }
  function spawn() {
    if (npcs.length >= 2) return;
    const p = spawnPoint(player.root.position, world.obstacles);
    if (!p) return;
    const def = definitions[serial % definitions.length];
    const npc = new NPC(scene, new Vector3(p.x, 0, p.z), def, ++serial);
    npcs.push(npc);
    npc.root.getChildMeshes().forEach((m) => world.shadow.addShadowCaster(m));
    audio.tone("spawn");
    audio.announce();
    toast("صعد الدولار! شوف صاحب اللافتة ↗");
  }
  const minimap = document.querySelector<HTMLCanvasElement>("#map")!,
    ctx = minimap.getContext("2d")!;
  let mapAge = 0;
  function map() {
    ctx.clearRect(0, 0, 130, 130);
    ctx.fillStyle = "#d3b992";
    ctx.fillRect(0, 0, 130, 130);
    ctx.fillStyle = "#7c8985";
    ctx.fillRect(45, 0, 40, 130);
    ctx.fillStyle = "#987e5d";
    for (const o of world.obstacles)
      ctx.fillRect(65 + o.x * 2 - o.w, 65 - o.z * 2 - o.d, o.w * 2, o.d * 2);
    ctx.fillStyle = "#f9d24e";
    ctx.beginPath();
    ctx.arc(
      65 + player.root.position.x * 2,
      65 - player.root.position.z * 2,
      4,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = "#dd4438";
    for (const n of npcs.filter((n) => n.state === "idle")) {
      ctx.beginPath();
      ctx.arc(
        65 + n.root.position.x * 2,
        65 - n.root.position.z * 2,
        3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  function frame() {
    try {
      const dt = Math.min(0.04, engine.getDeltaTime() / 1000);
      if (started && !paused && round.running) {
        time += dt;
        round.tick(dt);
        cooldown = Math.max(0, cooldown - dt);
        nextSpawn -= dt;
        if (nextSpawn <= 0) {
          spawn();
          nextSpawn = round.interval();
        }
        const mv = input.movement(),
          length = Math.hypot(mv.x, mv.z);
        if (length > 0.08) {
          const angle = Math.atan2(mv.x, mv.z) + input.yaw,
            dir = new Vector3(Math.sin(angle), 0, Math.cos(angle)),
            speed = (mv.run ? 6 : 3.3) * Math.min(1, length);
          const proposed = player.root.position.add(dir.scale(dt * speed));
          if (clearPoint(proposed, world.obstacles, 0.43)) {
            collider.position.copyFrom(player.root.position);
            collider.position.y = 0;
            collider.moveWithCollisions(dir.scale(dt * speed));
            player.root.position.x = collider.position.x;
            player.root.position.z = collider.position.z;
          }
          player.root.rotation.y = angle;
        }
        if (input.consume("jump") && jumpY === 0) {
          jumpV = 6;
          audio.tone("jump");
        }
        jumpV -= dt * 17;
        jumpY = Math.max(0, jumpY + jumpV * dt);
        if (jumpY === 0) jumpV = 0;
        player.root.position.y = jumpY;
        const active = npcs.filter((n) => n.state === "idle");
        const closest = active.sort(
          (a, b) =>
            Vector3.DistanceSquared(a.root.position, player.root.position) -
            Vector3.DistanceSquared(b.root.position, player.root.position),
        )[0];
        if (input.consume("interact"))
          toast(
            closest &&
              Vector3.Distance(closest.root.position, player.root.position) < 4
              ? "أبو الدولار: السوق صاعد والراتب نايم!"
              : "اقترب من صاحب اللافتة حتى تتفاعل",
          );
        if (input.consume("punch") && cooldown === 0) {
          cooldown = 0.7;
          punchAge = 0;
          const target = active.find((n) =>
            canHit(
              player.root.position,
              n.root.position,
              player.root.rotation.y,
            ),
          );
          if (
            target &&
            jumpY < 0.9 &&
            target.hit(target.root.position.subtract(player.root.position)) &&
            round.hit(target.id)
          ) {
            impact(target.root.position.add(new Vector3(0, 1.7, 0)));
            audio.tone("hit");
            peakCombo = Math.max(peakCombo, round.combo);
            toast(
              [
                "راجدي عالغلاء! +100",
                "الراتب يتفرج… +100",
                "خفّف علينا أبو الدولار! +100",
              ][round.credited.size % 3],
            );
            shake = 0.15;
          } else toast("اقترب وواجه صاحب اللافتة!");
        }
        if (punchAge >= 0) {
          punchAge += dt / 0.5;
          if (punchAge > 1) punchAge = -1;
        }
        player.animate(time, length > 0.08, mv.run, punchAge, jumpY > 0.05);
        npcs = npcs.filter((n) => {
          if (n.update(dt, time, player.root.position)) {
            impact(n.root.position.add(new Vector3(0, 0.3, 0)));
            n.dispose();
            return false;
          }
          return true;
        });
        effects = effects.filter((e) => {
          e.life -= dt;
          if (e.life <= 0) {
            e.mesh.material?.dispose();
            e.mesh.dispose();
            return false;
          }
          e.velocity.y -= dt * 5;
          e.mesh.position.addInPlace(e.velocity.scale(dt));
          e.mesh.scaling.setAll(e.life / e.max);
          return true;
        });
        txt("score", round.score);
        txt("time", Math.ceil(round.remaining));
        txt("combo", round.combo > 1 ? "تتابع ×" + round.combo : "");
        show("target", !!closest);
        if (closest) {
          const delta = closest.root.position.subtract(player.root.position);
          const relative = Math.atan2(delta.x, delta.z) - input.yaw;
          txt(
            "target",
            (Math.abs(relative) > 0.8
              ? Math.sin(relative) > 0
                ? "يمين ↗ "
                : "↖ يسار "
              : "↑ أمامك ") +
              (canHit(
                player.root.position,
                closest.root.position,
                player.root.rotation.y,
              )
                ? "اضغط راجدي!"
                : Math.round(delta.length()) + " متر"),
          );
        }
        mapAge += dt;
        if (mapAge > 0.15) {
          mapAge = 0;
          map();
        }
        if (!round.running) finish();
      }
      const target = player.root.position.add(new Vector3(0, 1.35, 0)),
        distance = 6.2;
      const offset = new Vector3(
        -Math.sin(input.yaw) * distance,
        2 + input.pitch * 3,
        -Math.cos(input.yaw) * distance,
      );
      const ray = new Ray(target, offset.normalizeToNew(), offset.length());
      const hit = scene.pickWithRay(
        ray,
        (m) => m.checkCollisions && m !== collider,
      );
      let desired = target.add(offset);
      if (hit?.hit && hit.pickedPoint)
        desired = hit.pickedPoint.subtract(ray.direction.scale(0.4));
      camera.position = Vector3.Lerp(
        camera.position,
        desired,
        Math.min(1, dt * 9),
      );
      shake = Math.max(0, shake - dt);
      if (shake > 0) camera.position.x += (Math.random() - 0.5) * shake;
      camera.setTarget(target);
      scene.render();
      if (scene.isReady()) show("loading", false);
    } catch (e) {
      engine.stopRenderLoop();
      txt("fatalText", String(e));
      show("fatal", true);
      show("loading", false);
    }
  }
  let shake = 0;
  engine.runRenderLoop(frame);
}
