import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Flag, Swords, X } from "lucide-react";

export default function GameSetupModal({
  categories,
  onClose,
  onStart,
}) {
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const submit = (event) => {
    event.preventDefault();

    const first = team1.trim();
    const second = team2.trim();

    if (!first || !second) {
      setError("اكتب اسم الفريقين أولًا.");
      return;
    }

    if (first === second) {
      setError("اختر اسمين مختلفين للفريقين.");
      return;
    }

    setError("");

    onStart({
      team1: first,
      team2: second,
    });
  };

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.975 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.985 }}
        transition={{ duration: 0.2 }}
        onMouseDown={(event) => event.stopPropagation()}
        className="relative max-h-[calc(100dvh-32px)] w-full max-w-[680px] overflow-y-auto rounded-[32px] border border-white/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]"
      >
        {/* Background details */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
          <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-orange-100/45 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-60 w-60 rounded-full bg-sky-100/55 blur-3xl" />
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute left-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:bg-slate-100 hover:text-slate-800"
          aria-label="إغلاق"
        >
          <X size={18} />
        </button>

        <div className="relative z-10 p-5 sm:p-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-500 to-cyan-500 text-white shadow-lg shadow-indigo-200/50">
              <Swords size={22} strokeWidth={2.5} />
            </div>

            <div className="mx-auto mt-3 flex w-fit max-w-[90%] flex-wrap items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[11px] font-black text-slate-500 sm:text-xs">
              {categories.map((category, index) => (
                <span key={category.id} className="flex items-center gap-1.5">
                  <span>{category.name}</span>
                  {index < categories.length - 1 && (
                    <span className="text-slate-300">•</span>
                  )}
                </span>
              ))}
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-[34px]">
              جاهزين للتحدي؟
            </h2>

            <p className="mx-auto mt-1.5 max-w-lg text-sm leading-6 text-slate-500">
              اختاروا أسماء الفريقين، وبعدها تبدأ المنافسة مباشرة.
            </p>
          </div>

          <form onSubmit={submit} className="mt-5">
            {/* Team 1 */}
            <div className="rounded-[22px] border border-orange-100 bg-orange-50/40 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-orange-500">
                    الفريق الأول
                  </p>
                  <p className="mt-0.5 text-[11px] font-bold text-slate-400">
                    الفريق البرتقالي
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-500">
                  <Flag size={18} strokeWidth={2.5} />
                </div>
              </div>

              <input
                value={team1}
                onChange={(event) => {
                  setTeam1(event.target.value);
                  if (error) setError("");
                }}
                placeholder="مثال: الزعماء"
                autoFocus
                maxLength={30}
                className="mt-3 h-12 w-full rounded-2xl border-2 border-orange-100 bg-white px-4 text-base font-bold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-orange-300 focus:ring-4 focus:ring-orange-100/60"
              />
            </div>

            {/* VS */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-x-0 h-px bg-slate-100" />
              <span className="relative rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black text-slate-400 shadow-sm">
                VS
              </span>
            </div>

            {/* Team 2 */}
            <div className="rounded-[22px] border border-sky-100 bg-sky-50/40 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-sky-500">
                    الفريق الثاني
                  </p>
                  <p className="mt-0.5 text-[11px] font-bold text-slate-400">
                    الفريق الأزرق
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-500">
                  <Flag size={18} strokeWidth={2.5} />
                </div>
              </div>

              <input
                value={team2}
                onChange={(event) => {
                  setTeam2(event.target.value);
                  if (error) setError("");
                }}
                placeholder="مثال: القيصر"
                maxLength={30}
                className="mt-3 h-12 w-full rounded-2xl border-2 border-sky-100 bg-white px-4 text-base font-bold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-sky-300 focus:ring-4 focus:ring-sky-100/60"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-2.5 text-center text-sm font-black text-red-500"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              className="mt-4 flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 via-orange-500 to-amber-400 px-6 text-base font-black text-white shadow-[0_12px_30px_rgba(249,115,22,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(249,115,22,0.32)] active:translate-y-0"
            >
              ابدأ التحدي
              <ArrowLeft size={18} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="mt-2.5 h-11 w-full rounded-2xl border border-slate-200 bg-white font-black text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            >
              رجوع
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
