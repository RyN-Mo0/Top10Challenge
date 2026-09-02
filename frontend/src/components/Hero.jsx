import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Clock3,
  Gamepad2,
  HelpCircle,
  Layers3,
  Sparkles,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";

const steps = [
  {
    icon: Layers3,
    title: "اختاروا 3 فئات",
    text: "ابدؤوا باختيار ثلاث فئات مختلفة. كل فئة تحتوي على سؤالين، بإجمالي 6 تحديات.",
  },
  {
    icon: Users,
    title: "كوّنوا فريقين",
    text: "اكتبوا اسم الفريق الأول والثاني، وبعدها تختارون الفئة التي تريدون البدء بها.",
  },
  {
    icon: Zap,
    title: "جاوبوا بالتناوب",
    text: "كل محاولة تنقل الدور تلقائيًا للفريق الآخر، سواء كانت الإجابة صحيحة أو خاطئة.",
  },
  {
    icon: Trophy,
    title: "تنافسوا على البونص",
    text: "بعد سؤالين من نفس الفئة، الفريق الأعلى نقاطًا يحصل على +10 بونص.",
  },
];

export default function Hero({ onStart }) {
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <section className="relative min-h-[100dvh] overflow-hidden bg-[#F8FAFC] px-5">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-36 -top-40 h-[520px] w-[520px] rounded-full bg-indigo-200/45 blur-[90px]" />
        <div className="absolute -left-28 top-[28%] h-[430px] w-[430px] rounded-full bg-cyan-200/45 blur-[95px]" />
        <div className="absolute left-[42%] top-[58%] h-[340px] w-[340px] rounded-full bg-violet-200/30 blur-[90px]" />
      </div>
      
      <div className="relative mx-auto flex min-h-[100dvh] max-w-7xl flex-col">
        <header className="flex h-24 shrink-0 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[20px] bg-gradient-to-br from-indigo-600 via-violet-500 to-cyan-500 text-white shadow-xl shadow-indigo-200/60">
              <span className="text-xl font-black tracking-tight">10</span>
              <span className="absolute bottom-1.5 right-2 h-1.5 w-1.5 rounded-full bg-white/80" />
            </div>

            <div>
              <p className="text-xl font-black text-slate-950">تحدي العشرة الأوائل</p>
              <p className="text-xs font-bold text-slate-400">Top 10 Challenge</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHowToPlay(true)}
              className="rounded-full border border-slate-200 bg-white/75 px-5 py-3 text-sm font-bold text-slate-600 shadow-sm backdrop-blur transition hover:border-indigo-200 hover:text-indigo-600"
            >
              طريقة اللعب
            </button>

            <button
              className="rounded-full bg-indigo-50 px-5 py-3 text-sm font-black text-indigo-600"
            >
              الرئيسية
            </button>
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
          <div className="relative">
            <div className="pointer-events-none absolute left-1/2 top-1/2 -z-0 -translate-x-1/2 -translate-y-1/2 text-[330px] font-black leading-none text-indigo-500/[0.045] sm:text-[430px]">10</div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">


              <h1 className="mx-auto mt-8 max-w-5xl text-5xl font-black leading-[1.12] tracking-tight text-slate-950 sm:text-6xl lg:text-8xl">
                <span className="text-orange-400">تحدي</span>{" "}
                <span>العشرة الأوائل</span>
              </h1>

              <p className="mx-auto mt-6 max-w-3xl text-lg leading-9 text-slate-500 sm:text-xl">
                اكتشف أشهر 10 إجابات، تنافس مع أصدقائك، واجمع أكبر عدد من النقاط في تجربة جماعية سريعة ومليئة بالحماس.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={onStart}
                  className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-l from-indigo-600 to-cyan-500 px-10 py-4 text-lg font-black text-white shadow-xl shadow-indigo-200/70 transition hover:-translate-y-1"
                >
                  ابدأ التحدي الآن
                  <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
                </button>
              </div>

              <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
                <Feature icon={Users} title="فريق ضد فريق" subtitle="منافسة جماعية" tone="indigo" />
                <Feature icon={Gamepad2} title="3 فئات 6 تحديات" subtitle="اسئلة متنوعة" tone="violet" />
                <Feature icon={Clock3} title="ابدأ خلال أقل من دقيقة" tone="cyan" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showHowToPlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => setShowHowToPlay(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              onMouseDown={(e) => e.stopPropagation()}
              className="relative max-h-[90dvh] w-full max-w-4xl overflow-y-auto rounded-[34px] bg-white p-6 shadow-2xl sm:p-9"
            >
              <button onClick={() => setShowHowToPlay(false)} className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <X size={20} />
              </button>

              <div className="text-center">
                <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-600">
                  <Gamepad2 size={17} />
                  طريقة اللعب
                </div>

                <h2 className="mt-5 text-3xl font-black text-slate-950 sm:text-4xl">كيف تلعب تحدي العشرة الأوائل؟</h2>
                <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-500">
                  مباراة قصيرة بين فريقين، تتكون من ثلاث فئات وستة تحديات. الهدف هو جمع أكبر عدد من النقاط والفوز ببونصات الفئات.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="rounded-[26px] border border-slate-200 bg-slate-50/60 p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                          <Icon size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-indigo-500">0{index + 1}</span>
                            <h3 className="font-black text-slate-900">{step.title}</h3>
                          </div>
                          <p className="mt-2 text-sm leading-7 text-slate-500">{step.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-[26px] border border-amber-100 bg-amber-50/70 p-5">
                <h3 className="font-black text-amber-700">كيف تُحسب النقاط؟</h3>
                <p className="mt-2 text-sm leading-7 text-amber-700/80">
                  كل إجابة صحيحة تمنح نقاطًا حسب ترتيبها في قائمة Top 10. بعد انتهاء السؤالين في الفئة، الفريق الأعلى نقاطًا في الفئة يحصل على +10 نقاط بونص. في نهاية الفئات الثلاث يفوز صاحب أعلى مجموع عام.
                </p>
              </div>

              <button
                onClick={() => setShowHowToPlay(false)}
                className="mt-6 h-14 w-full rounded-2xl bg-gradient-to-l from-indigo-600 to-cyan-500 font-black text-white shadow-lg"
              >
                فهمت، أغلق الشرح
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Feature({ icon: Icon, title, subtitle, tone }) {
  const styles = {
    indigo: "from-indigo-50/90 to-white/80 text-indigo-600 border-indigo-100",
    violet: "from-violet-50/90 to-white/80 text-violet-600 border-violet-100",
    cyan: "from-cyan-50/90 to-white/80 text-cyan-600 border-cyan-100",
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-[20px] border bg-gradient-to-l px-4 py-4 text-right shadow-sm backdrop-blur ${styles[tone]}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 shadow-sm">
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <p className="font-black text-slate-800">{title}</p>
        <p className="mt-0.5 text-xs font-bold text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}
