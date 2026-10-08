import { Wallet, purchasingPower } from "../economy/wallet";
import { stages, goods, bills, family } from "../data/missions";
export type Snapshot = {
  stage: number;
  elapsed: number;
  balance: number;
  ledger: import("../economy/wallet").Entry[];
  score: number;
  selected: string[];
  step: number;
  index: number;
  distance: number;
  coins: number;
  hits: number;
  fuel: number;
  phase: number;
};
export class Mission {
  stage: number;
  elapsed = 0;
  wallet: Wallet;
  score = 0;
  selected = new Set<string>();
  step = 0;
  index = 1;
  distance = 0;
  coins = 0;
  hits = 0;
  fuel = 0;
  phase = 0;
  status: "playing" | "won" | "lost" = "playing";
  message = "";
  constructor(stage: number) {
    if (!stages.some((s) => s.id === stage)) throw Error("Unknown stage");
    this.stage = stage;
    this.wallet = new Wallet(stages[stage - 1].budget);
  }
  get config() {
    return stages[this.stage - 1];
  }
  get remaining() {
    return Math.max(0, this.config.time - this.elapsed);
  }
  get inflation() {
    return 1 + Math.min(4, Math.floor(this.elapsed / 22)) * 0.08;
  }
  price(id: string) {
    const g = goods.find((g) => g.id === id)!;
    return Math.ceil((g.price * this.inflation) / 100) * 100;
  }
  finish(won: boolean, message: string) {
    if (this.status !== "playing") return;
    this.status = won ? "won" : "lost";
    this.message = message;
    if (won) this.score += 500 + Math.floor(this.remaining) * 2;
  }
  tick(dt: number) {
    if (this.status !== "playing") return;
    this.elapsed += Math.max(0, Math.min(1, dt));
    if (!this.remaining) this.finish(false, "خلص الوقت… الأسعار أسرع منّا!");
  }
  buy(id: string) {
    if (
      this.stage !== 1 ||
      this.status !== "playing" ||
      this.selected.has(id) ||
      !goods.some((g) => g.id === id)
    )
      return false;
    const g = goods.find((g) => g.id === id)!;
    if (!this.wallet.spend(id, g.name, this.price(id))) {
      this.message = "الرصيد ما يكفي. راجع قائمة المصروفات.";
      return false;
    }
    this.selected.add(id);
    this.score += 100;
    if (this.selected.size === goods.length)
      this.finish(true, "كمّلت السلة! الراتب تنفّس شوية.");
    return true;
  }
  collect(id: string) {
    if (
      this.stage !== 2 ||
      this.status !== "playing" ||
      !this.wallet.credit(id, "دينار بالشارع", 1000)
    )
      return false;
    this.coins++;
    this.score += 100;
    return true;
  }
  collision(id: string) {
    if (this.stage !== 2 || this.status !== "playing" || this.selected.has(id))
      return false;
    this.selected.add(id);
    this.hits++;
    this.wallet.spend(
      "penalty-" + id,
      "فاتورة مفاجئة",
      Math.min(3000, this.wallet.balance),
    );
    if (this.hits >= 3)
      this.finish(false, "الفواتير لحگتك! جرّب القفز وتغيير المسار.");
    return true;
  }
  run(dt: number) {
    if (this.stage !== 2 || this.status !== "playing") return;
    this.distance += dt * Math.min(9, 5 + this.distance * 0.025);
    if (this.distance >= 160)
      this.finish(
        this.coins >= 8,
        this.coins >= 8
          ? "سبقت الغلاء وجمعت الدنانير!"
          : "وصلت، بس تحتاج تجمع 8 دنانير على الأقل.",
      );
  }
  choose(action: string) {
    if (this.status !== "playing") return false;
    switch (this.stage) {
      case 3: {
        const b = bills.find((b) => b.id === action);
        if (b) {
          const late = b.id === "rent" && this.step >= 2 ? 60000 : 0;
          if (
            !this.wallet.spend(
              b.id,
              b.name + (late ? " + تأخير" : ""),
              b.price + late,
            )
          )
            return false;
          this.selected.add(b.id);
          this.step++;
          this.score += 80;
          this.message = late
            ? "تأخرت على الإيجار، انضافت غرامة افتراضية."
            : "دفعت " + b.name;
          if (this.selected.size === 4)
            this.finish(
              this.wallet.balance >= 80000,
              this.wallet.balance >= 80000
                ? "الفواتير مدفوعة وباقي احتياط للشهر!"
                : "دفعت الفواتير، بس الاحتياط أقل من 80 ألف. جرّب الإيجار مبكراً.",
            );
          return true;
        }
        break;
      }
      case 4: {
        if (action === "salary" && this.step === 0) {
          this.wallet.credit("salary", "راتب افتراضي", 1000000);
          this.step = 1;
          return true;
        }
        if (action === "wave" && this.step >= 1 && this.step < 4) {
          this.index += 0.15;
          this.step++;
          this.message =
            "الراتب بعده مليون. الأسعار زادت 15 نقطة من المؤشر الأساسي.";
          return true;
        }
        if (action === "real" && this.step === 4) {
          this.score += 300;
          this.finish(
            true,
            "صحيح! الراتب الاسمي ثابت، لكن القدرة الشرائية تقل عند ارتفاع الأسعار.",
          );
          return true;
        }
        if (action === "nominal" && this.step === 4) {
          this.finish(
            false,
            "الرقم ما تغير. الذي انخفض هو كمية السلع التي يستطيع الراتب شراءها.",
          );
          return true;
        }
        break;
      }
      case 5: {
        const options: Record<string, { price: number; minutes: number }> = {
          taxi: { price: 15000, minutes: 12 },
          negotiate: { price: 11000, minutes: 18 },
          bus: { price: 4000, minutes: 28 },
          walk: { price: 0, minutes: 55 },
        };
        const o = options[action];
        if (o) {
          this.wallet.spend("trip", "مواصلات", o.price);
          this.step = o.minutes;
          this.score += Math.max(0, 200 - o.price / 100);
          this.finish(
            o.minutes <= 30 && this.wallet.balance >= 8000,
            o.minutes <= 30 && this.wallet.balance >= 8000
              ? "وصلت بوقت مناسب وبقي رصيد!"
              : "تحتاج وصول خلال 30 دقيقة واحتياط 8 آلاف.",
          );
          return true;
        }
        break;
      }
      case 6: {
        if (action === "insult") {
          this.finish(false, "البائع: المفاصلة حلوة، بس الاحترام أحلى!");
          return true;
        }
        if (action === "ask" && this.step === 0) {
          this.step = 1;
          this.message = "البائع: إلك بـ 26 ألف، بس لا تخبر الجيران!";
          return true;
        }
        if (action === "bundle" && this.step < 2) {
          this.step = 2;
          this.message = "عرض كمية: 24 ألف. سعر افتراضي للعبة.";
          return true;
        }
        if (action === "accept") {
          const price =
            this.step === 2 ? 24000 : this.step === 1 ? 26000 : 30000;
          this.wallet.spend("bargain", "شراء بالمفاصلة", price);
          this.score += 30000 - price;
          this.finish(
            price <= 26000,
            price <= 26000
              ? "فاصلت بأدب ووفرت!"
              : "اشتريت بالسعر الأول… اطلب آخر سعر بالمحاولة القادمة.",
          );
          return true;
        }
        break;
      }
      case 7: {
        if (action === "done") {
          const ok =
            family
              .filter((x) => x.essential)
              .every((x) => this.selected.has(x.id)) &&
            this.wallet.balance >= 100000;
          this.finish(
            ok,
            ok
              ? "غطيت الضروريات وباقي احتياط 100 ألف وأكثر!"
              : "أكمل الضروريات وخلي احتياط 100 ألف. أجّل الكماليات.",
          );
          return true;
        }
        const item = family.find((x) => x.id === action);
        if (
          item &&
          !this.selected.has(item.id) &&
          this.wallet.spend(item.id, item.name, item.price)
        ) {
          this.selected.add(item.id);
          this.score += item.essential ? 100 : 0;
          return true;
        }
        break;
      }
      case 8: {
        if (this.phase === 0) {
          if (action === "pump" && this.fuel < 12) {
            if (this.wallet.spend("fuel-" + this.fuel, "وقود افتراضي", 1000)) {
              this.fuel++;
              if (this.fuel > 10)
                this.finish(
                  false,
                  "زادت التعبئة عن 10 لترات! حاول توقف بالمقدار المطلوب.",
                );
              return true;
            }
          }
          if (action === "stop") {
            if (this.fuel === 10) {
              this.phase = 1;
              this.score += 200;
              return true;
            }
            this.finish(false, "المطلوب 10 لترات بالضبط. كل ضغطة تضيف لتراً.");
            return true;
          }
        } else if (this.phase === 1) {
          const price =
            action === "phone-budget"
              ? 250000
              : action === "phone-premium"
                ? 400000
                : 0;
          if (price) {
            if (!this.wallet.spend("phone", "هاتف", price)) {
              this.finish(false, "هذا الهاتف خارج الميزانية.");
              return true;
            }
            if (price > 300000) {
              this.finish(false, "تحدي الهاتف: الحد 300 ألف.");
              return true;
            }
            this.phase = 2;
            this.score += 200;
            return true;
          }
        } else if (this.phase === 2) {
          const price =
            action === "school-list"
              ? 80000
              : action === "school-luxury"
                ? 220000
                : 0;
          if (price) {
            if (!this.wallet.spend("school", "مستلزمات مدرسية", price)) {
              this.finish(false, "خلص الراتب وباقي المدرسة!");
              return true;
            }
            this.finish(
              this.wallet.balance >= 100000,
              this.wallet.balance >= 100000
                ? "نجحت بتحديات الوقود والهاتف والمدرسة!"
                : "اشتريت، بس احتياط العائلة أقل من 100 ألف.",
            );
            return true;
          }
        }
        break;
      }
    }
    return false;
  }
  get power() {
    return purchasingPower(1000000, this.index);
  }
  snapshot(): Snapshot {
    return {
      stage: this.stage,
      elapsed: this.elapsed,
      balance: this.wallet.balance,
      ledger: this.wallet.ledger.map((e) => ({ ...e })),
      score: this.score,
      selected: [...this.selected],
      step: this.step,
      index: this.index,
      distance: this.distance,
      coins: this.coins,
      hits: this.hits,
      fuel: this.fuel,
      phase: this.phase,
    };
  }
  static restore(data: Snapshot) {
    const m = new Mission(data.stage);
    m.elapsed = data.elapsed;
    m.wallet.balance = data.balance;
    m.wallet.ledger = data.ledger.map((e) => ({ ...e }));
    m.score = data.score;
    m.selected = new Set(data.selected);
    for (const k of [
      "step",
      "index",
      "distance",
      "coins",
      "hits",
      "fuel",
      "phase",
    ] as const)
      m[k] = data[k];
    return m;
  }
}
