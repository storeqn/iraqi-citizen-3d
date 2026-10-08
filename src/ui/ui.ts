import { stages, goods, bills, family } from "../data/missions";
import type { Mission } from "../missions/session";
import type { Progress } from "../utils/progress";
export const money = (v: number) =>
  Math.floor(v).toLocaleString("en-US") + " د.ع";
export function show(id: string, on: boolean) {
  document.getElementById(id)!.hidden = !on;
}
export function txt(id: string, v: string | number) {
  document.getElementById(id)!.textContent = String(v);
}
export function mount() {
  document.querySelector("#app")!.innerHTML =
    `<canvas id="game" aria-label="مدينة عراقية ثلاثية الأبعاد"></canvas><div id="loading" class="overlay"><section class="menu compact"><div class="badge">نجهّز السوق…</div><h2>المواطن ضد الغلاء 3D</h2><progress id="loadProgress" max="100" value="0"></progress><p id="loadText">تهيئة المحرك</p></section></div><header id="hud" hidden><div class="score"><small>الرصيد</small><strong id="balance">0</strong><span id="score">0 نقطة</span></div><div class="clock"><span id="time">0</span> ث <button id="pause" aria-label="إيقاف مؤقت">Ⅱ</button></div><canvas id="map" width="130" height="130" aria-label="خريطة المدينة"></canvas></header><div id="objective" hidden></div><div id="target" hidden></div><div id="toast" role="status"></div><div id="controls" hidden><div id="stick" aria-label="عصا الحركة"><div id="knob"></div></div><div class="actions"><button id="jump" aria-label="قفز">↟<small>قفز</small></button><button id="interact" aria-label="تفاعل">✋<small>تفاعل E</small></button></div></div><div id="menu" class="overlay" hidden><section class="menu"><div class="badge">تحديات كوميدية • مدينة عراقية ثلاثية الأبعاد</div><div class="dollar">$ ↗</div><h1>المواطن<br>ضد الغلاء <b>3D</b></h1><h2>الراتب ثابت والأسعار تطير!</h2><p>تسوّق، فاوض، اركض وخطّط للشهر.<br>ثمان مراحل… وميزانية لازم تكفي!</p><button id="start" class="primary">ابدأ المغامرة ◀</button><button id="continue" hidden>استئناف المرحلة المحفوظة</button><div class="menu-row"><button id="levels">المراحل</button><button id="settings">الإعدادات</button><button id="results">النتائج</button></div><div class="best"><span id="campaignStats"></span></div><small class="prototype">كل الأسعار والأحداث افتراضية للعبة • نتائج محلية على هذا الجهاز</small></section></div><dialog id="levelsDialog" class="wide"><div class="dialog-heading"><h2>اختَر تحدّيك</h2><button class="closeDialog">✕</button></div><div id="stageCards" class="stage-grid"></div></dialog><dialog id="settingsDialog"><h2>على راحتك</h2><label>جودة الرسوم<select id="quality"><option value="low">Low — أسرع</option><option value="medium">Medium — متوازنة</option><option value="high">High — أوضح</option></select></label><label>لون الهودي<select id="outfit"><option value="white">أبيض</option><option value="cream">كريمي</option><option value="mint">نعناعي</option></select></label><button id="mute">الصوت</button><p>WASD للحركة، اسحب الماوس لتدوير الكاميرا، Space للقفز، E للتفاعل، Escape للاستراحة. على الهاتف استخدم العصا والأزرار والسحب.</p><p>إعلان صوتي اختياري بصوت الجهاز؛ لا نستعمل تسجيل أشخاص حقيقيين.</p><button id="resetAsk">إعادة ضبط التقدم</button><div id="resetConfirm" hidden><p>سيُمسح تقدم هذه اللعبة على الجهاز.</p><button id="resetSave">تأكيد المسح</button></div><button class="closeDialog">حفظ وإغلاق</button></dialog><dialog id="resultsDialog"><h2>نتائج هذا الجهاز</h2><p id="resultsText"></p><div id="achievements"></div><button class="closeDialog">رجوع</button></dialog><dialog id="choiceDialog"><div class="dialog-heading"><h2 id="choiceTitle"></h2><button class="closeDialog">✕</button></div><p id="choiceIntro"></p><div id="choices"></div><details><summary>سجل المصروفات</summary><div id="ledger"></div></details></dialog><div id="paused" class="overlay" hidden><section class="menu compact"><h2>استراحة چاي ☕</h2><button id="resume" class="primary">نكمل</button><button id="pauseSettings">الإعدادات</button><button id="quit">حفظ ورجوع للقائمة</button></section></div><div id="end" class="overlay" hidden><section class="menu compact"><div id="endBadge" class="badge"></div><h2 id="endTitle"></h2><p id="endMessage"></p><strong id="finalScore"></strong><p id="endBalance"></p><button id="next" class="primary">المرحلة التالية</button><button id="restart">إعادة المحاولة</button><button id="share">شارك النتيجة</button><button id="home">القائمة الرئيسية</button></section></div><div id="fatal" class="overlay" hidden><section class="menu"><h2>تعذّر تشغيل المشهد</h2><p id="fatalText"></p><button onclick="location.reload()">إعادة المحاولة</button></section></div>`;
  document
    .querySelectorAll(".closeDialog")
    .forEach((b) =>
      b.addEventListener("click", () => b.closest("dialog")!.close()),
    );
}
export function progress(n: number, text: string) {
  document.querySelector<HTMLProgressElement>("#loadProgress")!.value = n;
  txt("loadText", `${text} • ${Math.round(n)}%`);
}
export function refreshMenu(p: Progress) {
  txt(
    "campaignStats",
    `${Object.keys(p.completed).length}/8 مراحل • ${p.total.toLocaleString("en-US")} نقطة`,
  );
  show("continue", !!p.resume);
  document.querySelector("#stageCards")!.innerHTML = stages
    .map(
      (s) =>
        `<button class="stage-card" data-stage="${s.id}"><div class="stage-art" style="--card-color:${s.color}"><img src="./icons/stage-${s.id}.svg" alt="${s.title}"></div><small>المرحلة ${s.id} • ${s.place}</small><strong>${s.title}</strong><span>${s.subtitle}</span><b>${p.completed[s.id] ? "★".repeat(p.completed[s.id].stars) : "جاهزة للعب"}</b></button>`,
    )
    .join("");
  txt(
    "resultsText",
    `${p.total.toLocaleString("en-US")} نقطة • مجموع أفضل النتائج لكل مرحلة. إعادة اللعب لا تكرر النقاط.`,
  );
  const completed = Object.keys(p.completed).length;
  document.querySelector("#achievements")!.innerHTML =
    [
      ["متسوّق شاطر", !!p.completed[1]],
      ["سبقت الدولار", !!p.completed[2]],
      ["مدبّر البيت", !!p.completed[7]],
      ["خبير الميزانية", completed === 8],
    ]
      .map(([title, ok]) => `<p>${ok ? "🏅" : "○"} ${title}</p>`)
      .join("") +
    Object.entries(p.completed)
      .map(
        ([id, r]) =>
          `<p>${stages[Number(id) - 1].title} • ${r.score} نقطة • ${"★".repeat(r.stars)}</p>`,
      )
      .join("");
}
let timer: ReturnType<typeof setTimeout>;
export function toast(text: string) {
  txt("toast", text);
  document.getElementById("toast")!.classList.add("visible");
  clearTimeout(timer);
  timer = setTimeout(
    () => document.getElementById("toast")!.classList.remove("visible"),
    2400,
  );
}
export type Option = { id: string; label: string; disabled?: boolean };
export function options(m: Mission): { intro: string; choices: Option[] } {
  switch (m.stage) {
    case 3:
      return {
        intro:
          "ادفع الأربع فواتير وخلّي احتياط 80 ألف. الإيجار بعد عمليتي سداد يضيف 60 ألف تأخير افتراضي.",
        choices: bills.map((b) => ({
          id: b.id,
          label: `${b.name}: ${money(b.price + (b.id === "rent" && m.step >= 2 ? 60000 : 0))}`,
          disabled: m.selected.has(b.id),
        })),
      };
    case 4:
      return {
        intro: `راتبك الاسمي: ${money(1000000)}. مؤشر الأسعار: ${Math.round(m.index * 100)}. القدرة الشرائية بقيمة أسعار البداية: ${money(m.power)}. حسابها: الراتب ÷ مؤشر الأسعار النسبي. لا نتنبأ بسعر صرف حقيقي.`,
        choices:
          m.step === 0
            ? [{ id: "salary", label: "استلم الراتب الافتراضي" }]
            : m.step < 4
              ? [{ id: "wave", label: "شغّل موجة أسعار افتراضية +15 نقطة" }]
              : [
                  {
                    id: "real",
                    label: "القدرة الشرائية تقل… والراتب الاسمي ثابت",
                  },
                  { id: "nominal", label: "الراتب الاسمي نفسه صار أقل" },
                ],
      };
    case 5:
      return {
        intro:
          "أبو التكسي: ولك البنزين مو ببلاش! لازم توصل خلال 30 دقيقة ويبقى 8 آلاف احتياط.",
        choices: [
          { id: "taxi", label: "تكسي مباشر — 15 ألف / 12 دقيقة" },
          { id: "negotiate", label: "فاوض أبو التكسي — 11 ألف / 18 دقيقة" },
          { id: "bus", label: "باص مشترك — 4 آلاف / 28 دقيقة" },
          { id: "walk", label: "مشي — مجاناً / 55 دقيقة" },
        ],
      };
    case 6:
      return {
        intro: m.message || "البائع: بـ 30 ألف… تريده لو أرجعه للرف؟",
        choices: [
          { id: "ask", label: "حبيبي شنو آخر سعر؟", disabled: m.step !== 0 },
          {
            id: "bundle",
            label: "نسوي عرض كمية بـ 24 ألف؟",
            disabled: m.step >= 2,
          },
          {
            id: "accept",
            label: `أقبل السعر: ${money(m.step === 2 ? 24000 : m.step === 1 ? 26000 : 30000)}`,
          },
          { id: "insult", label: "أصرّ بأسلوب فظ" },
        ],
      };
    case 7:
      return {
        intro:
          "نشرة الأخبار: الأسعار تطير! غطّي الإيجار والأكل والفواتير والمدرسة وخلي 100 ألف احتياط. الكماليات يجوز تأجيلها.",
        choices: [
          ...family.map((f) => ({
            id: f.id,
            label: `${f.essential ? "أساسي" : "يمكن تأجيله"} • ${f.name}: ${money(f.price)}`,
            disabled: m.selected.has(f.id),
          })),
          { id: "done", label: "اعتمد ميزانية العائلة" },
        ],
      };
    case 8:
      if (m.phase === 0)
        return {
          intro: `الوقود: عبّئ 10 لترات بالضبط. كل ضغطة لتر بـ 1,000 دينار. الحالي ${m.fuel}/10 لتر.`,
          choices: [
            { id: "pump", label: "عبّئ لتر واحد" },
            { id: "stop", label: "أوقف التعبئة" },
          ],
        };
      if (m.phase === 1)
        return {
          intro:
            "تحدي الهاتف: اختر هاتفاً بحد أقصى 300 ألف واحتفظ بميزانية المدرسة.",
          choices: [
            { id: "phone-budget", label: "هاتف عملي — 250 ألف" },
            { id: "phone-premium", label: "هاتف فاخر — 400 ألف" },
          ],
        };
      return {
        intro: "تحدي المدرسة: اشترِ المستلزمات وخلي 100 ألف احتياط للعائلة.",
        choices: [
          { id: "school-list", label: "المستلزمات الأساسية — 80 ألف" },
          { id: "school-luxury", label: "مستلزمات فاخرة — 220 ألف" },
        ],
      };
    default:
      return { intro: "تفاعل داخل العالم ثلاثي الأبعاد.", choices: [] };
  }
}
export function drawChoices(m: Mission) {
  const o = options(m);
  txt("choiceTitle", m.config.title);
  txt("choiceIntro", o.intro + ` الرصيد: ${money(m.wallet.balance)}`);
  document.querySelector("#choices")!.innerHTML = o.choices
    .map(
      (c) =>
        `<button data-action="${c.id}" ${c.disabled ? "disabled" : ""}>${c.label}</button>`,
    )
    .join("");
  document.querySelector("#ledger")!.innerHTML =
    m.wallet.ledger
      .map(
        (e) =>
          `<p>${e.label} <b>${e.amount < 0 ? "−" : "+"}${money(Math.abs(e.amount))}</b></p>`,
      )
      .join("") || "<p>لا توجد مصروفات بعد.</p>";
}
