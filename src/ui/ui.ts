export function mount() {
  document.querySelector("#app")!.innerHTML =
    `<canvas id="game" aria-label="عالم اللعبة ثلاثي الأبعاد"></canvas><div id="loading">جاري فتح السوق…</div><header id="hud" hidden><div class="score"><small>النقاط</small><strong id="score">0</strong><span id="combo"></span></div><div class="clock"><span id="time">90</span> ث <button id="pause" aria-label="إيقاف مؤقت">Ⅱ</button></div><canvas id="map" width="130" height="130" aria-label="خريطة السوق"></canvas></header><div id="target" hidden>↗ <span>اتجه إلى اللافتة</span></div><div id="toast" role="status"></div><div id="controls" hidden><div id="stick" aria-label="عصا الحركة"><div id="knob"></div></div><div class="actions"><button id="jump" aria-label="قفز">↟<small>قفز</small></button><button id="interact" aria-label="تفاعل">؟<small>تفاعل</small></button><button id="punch" aria-label="ضربة كرتونية">✊<small>راجدي!</small></button></div></div><div id="menu" class="overlay"><section class="menu"><div class="badge">كوميديا عراقية • لعبة متصفح</div><div class="dollar">$ ↗</div><h1>يوميات<br>مواطن عراقي <b>3D</b></h1><h2>صعد الدولار!</h2><p>جولة بالسوق… والراتب بعده نفسه!<br>الحق أبو الدولار واجمع أعلى نتيجة.</p><button class="primary" id="start">ابدأ اللعب ◀</button><div class="menu-row"><button id="help">التعليمات</button><button id="settings">الإعدادات</button><button id="mute">الصوت: يعمل</button></div><div class="best">أعلى نتيجة: <b id="best">0</b></div><a href="./admin.html">مختبر الشخصيات</a><small class="prototype">نسخة أولى • شخصيات كرتونية أصلية قابلة لاستبدالها بـ GLB</small></section></div><dialog id="helpDialog"><h2>شلون نلعب؟</h2><p>حرّك الشخصية نحو صاحب اللافتة. اقترب وواجهه، ثم اضغط «راجدي!». كل تفاعل ناجح = 100 نقطة. الجولة 90 ثانية.</p><p>بالهاتف: عصا الحركة، اسحب على المشهد لتدوير الكاميرا، وأزرار القفز والضربة والتفاعل.</p><p>بالحاسبة: WASD للحركة، Shift للركض، Space للقفز، E للضربة، F للتفاعل. اسحب بالماوس لتدوير الكاميرا.</p><p>ظهور الشخصيات كل 10–20 ثانية. حافظ على التتابع حتى يرتفع Combo.</p><button class="closeDialog">تمام</button></dialog><dialog id="settingsDialog"><h2>الإعدادات</h2><label>جودة الرسوم <select id="quality"><option value="low">منخفضة — أسرع</option><option value="medium">متوسطة — متوازنة</option><option value="high">عالية — أوضح</option></select></label><p>الأصوات تُفعّل بعد الضغط على ابدأ. صوت الإعلان يعتمد على وجود صوت عربي في الجهاز.</p><button id="resetSave">إعادة ضبط النتيجة والإعدادات</button><button class="closeDialog">حفظ وإغلاق</button></dialog><div id="paused" class="overlay" hidden><section class="menu compact"><h2>استراحة چاي ☕</h2><p>اللعبة متوقفة مؤقتاً</p><button id="resume" class="primary">نكمل</button><button id="quit">إنهاء الجولة</button></section></div><div id="end" class="overlay" hidden><section class="menu compact"><div class="badge">خلصت الجولة!</div><h2>بعده الراتب نفسه 😅</h2><p>نتيجتك</p><strong id="finalScore">0</strong><p id="finalCombo"></p><button id="restart" class="primary">جولة جديدة</button><button id="share">شارك النتيجة على واتساب</button><button id="home">القائمة الرئيسية</button></section></div><div id="fatal" class="overlay" hidden><section class="menu"><h2>تعذّر تشغيل المشهد</h2><p id="fatalText"></p><button onclick="location.reload()">إعادة المحاولة</button></section></div>`;
  for (const name of ["help", "settings"])
    document
      .querySelector("#" + name)!
      .addEventListener("click", () =>
        document
          .querySelector<HTMLDialogElement>("#" + name + "Dialog")!
          .showModal(),
      );
  document
    .querySelectorAll(".closeDialog")
    .forEach((b) =>
      b.addEventListener("click", () => b.closest("dialog")!.close()),
    );
}
export function show(id: string, visible: boolean) {
  document.getElementById(id)!.hidden = !visible;
}
export function txt(id: string, value: string | number) {
  document.getElementById(id)!.textContent = String(value);
}
let timer: ReturnType<typeof setTimeout>;
export function toast(message: string) {
  txt("toast", message);
  document.getElementById("toast")!.classList.add("visible");
  clearTimeout(timer);
  timer = setTimeout(
    () => document.getElementById("toast")!.classList.remove("visible"),
    2200,
  );
}
