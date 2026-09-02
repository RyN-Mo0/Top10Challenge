import {
  useEffect,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clapperboard,
  Cpu,
  Dumbbell,
  Globe2,
  Shapes,
  Lock,
  Landmark,
  Gamepad2,
  MapPinned,
  PawPrint,
  CarFront,
  CircleHelp,
} from "lucide-react";
import BrandLogo from "./BrandLogo";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// ======================================================
// CATEGORY STYLES
// ======================================================

const categoryStyles = {
  // =========================
  // FREE
  // =========================

  technology: {
    description:
      "تحديات التقنية، الأجهزة، الشركات والابتكارات.",
    icon: Cpu,
  },

  sports: {
    description:
      "لاعبون، أندية، بطولات وأرقام رياضية شهيرة.",
    icon: Dumbbell,
  },

  football: {
    description:
      "أندية، منتخبات، بطولات وأرقام من عالم كرة القدم.",
    icon: Dumbbell,
  },

  entertainment: {
    description:
      "أفلام، مسلسلات وأعمال جماهيرية شهيرة.",
    icon: Clapperboard,
  },

  geography: {
    description:
      "دول، مساحات، سكان ومعرفة جغرافية حول العالم.",
    icon: Globe2,
  },

  mixed: {
    description:
      "خليط من التحديات العامة والمتنوعة.",
    icon: Shapes,
  },

  general: {
    description:
      "معلومات عامة ومواضيع متنوعة من حول العالم.",
    icon: CircleHelp,
  },

  // =========================
  // LOCKED
  // =========================

  history: {
    description:
      "حضارات، أحداث تاريخية، شخصيات ومعارك شهيرة.",
    icon: Landmark,
  },

  games: {
    description:
      "ألعاب فيديو، شخصيات، أجهزة وعناوين شهيرة.",
    icon: Gamepad2,
  },

  cities_capitals: {
    description:
      "مدن عالمية، عواصم ودول ومعالم جغرافية.",
    icon: MapPinned,
  },

  animals: {
    description:
      "حيوانات، كائنات، طبيعة ومعلومات عن عالم الحيوان.",
    icon: PawPrint,
  },

  cars: {
    description:
      "سيارات، شركات، موديلات وتاريخ عالم المحركات.",
    icon: CarFront,
  },
};

const defaultCategoryStyle = {
  icon:
    Shapes,

  description:
    "تحديات جديدة ومتنوعة.",
};

// ======================================================
// COMPONENT
// ======================================================

export default function Categories({
  onContinue,
  onBack,
}) {
  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    selected,
    setSelected,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    lockedMessage,
    setLockedMessage,
  ] = useState("");

  // ======================================================
  // LOAD CATEGORIES
  // ======================================================

  useEffect(() => {
    const fetchCategories =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(`${API_BASE}/api/categories`)

          if (
            !response.ok
          ) {
            throw new Error(
              "تعذر تحميل الفئات"
            );
          }

          const data =
            await response.json();

          const formattedCategories =
            data.map(
              (category) => {
                const style =
                  categoryStyles[
                    category.id
                  ] ||
                  defaultCategoryStyle;

                return {
                  ...category,
                  ...style,
                };
              }
            );

          /*
            المجانية أولًا
            ثم المقفلة.
          */
          formattedCategories.sort(
            (a, b) => {
              if (
                a.isFree ===
                  b.isFree
              ) {
                return 0;
              }

              return a.isFree
                ? -1
                : 1;
            }
          );

          setCategories(
            formattedCategories
          );
        } catch (err) {
          console.error(
            err
          );

          setError(
            "تعذر تحميل الفئات. تأكد أن السيرفر يعمل."
          );
        } finally {
          setLoading(
            false
          );
        }
      };

    fetchCategories();
  }, []);

  // ======================================================
  // LOCK MESSAGE
  // ======================================================

  const showLockedMessage =
    (category) => {
      setLockedMessage(
        `فئة ${category.name} مقفلة حاليًا وستتوفر لاحقًا 🔒`
      );

      window.clearTimeout(
        window.__top10LockedTimer
      );

      window.__top10LockedTimer =
        window.setTimeout(
          () => {
            setLockedMessage(
              ""
            );
          },
          2500
        );
    };

  // ======================================================
  // SELECT CATEGORY
  // ======================================================

  const toggleCategory =
    (category) => {
      // حماية إضافية
      if (
        category.isFree ===
        false
      ) {
        showLockedMessage(
          category
        );

        return;
      }

      const exists =
        selected.some(
          (item) =>
            item.id ===
            category.id
        );

      if (exists) {
        setSelected(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                category.id
            )
        );

        return;
      }

      if (
        selected.length >=
        3
      ) {
        return;
      }

      setSelected(
        (current) => [
          ...current,
          category,
        ]
      );
    };

  // ======================================================
  // UI
  // ======================================================

  return (
    <section
      id="categories"
      dir="rtl"
      className="relative min-h-[100dvh] overflow-y-auto bg-[#F8FAFC] px-5"
    >
      {/* BACKGROUND */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-36 -top-40 h-[520px] w-[520px] rounded-full bg-indigo-200/45 blur-[90px]" />

        <div className="absolute -left-28 top-[28%] h-[430px] w-[430px] rounded-full bg-cyan-200/45 blur-[95px]" />

        <div className="absolute left-[42%] top-[58%] h-[340px] w-[340px] rounded-full bg-orange-200/20 blur-[90px]" />
      </div>

      <div className="relative mx-auto min-h-screen max-w-[1450px]">

        {/* HEADER */}

        <header className="flex h-24 items-center justify-between">

          <BrandLogo />

          <button
            onClick={
              onBack
            }
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm backdrop-blur transition hover:bg-white"
          >
            <ArrowRight
              size={17}
            />

            رجوع
          </button>

        </header>

        {/* TITLE */}

        <div className="pt-5 text-center">

          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            اختر 3 فئات
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-500">
            اختر ثلاث فئات مجانية لبدء التحدي.
            كل فئة تحتوي على تحديين،
            والفريق المتفوق يحصل على البونص.
          </p>

          {/* COUNTER */}

          <div className="mx-auto mt-5 flex w-fit items-center gap-3 rounded-full border border-slate-200 bg-white/90 px-5 py-3 shadow-sm backdrop-blur">

            <div className="flex gap-2">

              {[0, 1, 2].map(
                (index) => (
                  <div
                    key={
                      index
                    }
                    className={`h-2.5 w-8 rounded-full transition ${
                      index <
                      selected.length
                        ? "bg-gradient-to-l from-orange-500 to-amber-400"
                        : "bg-slate-200"
                    }`}
                  />
                )
              )}

            </div>

            <span className="font-black text-slate-700">
              {
                selected.length
              }
              /3
            </span>

          </div>

          {/* LOCK MESSAGE */}

          <AnimatePresence>
            {lockedMessage && (
              <motion.div
                initial={{
                  opacity:
                    0,

                  y:
                    -5,

                  scale:
                    0.97,
                }}
                animate={{
                  opacity:
                    1,

                  y:
                    0,

                  scale:
                    1,
                }}
                exit={{
                  opacity:
                    0,

                  y:
                    -5,
                }}
                className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-900 px-5 py-2.5 text-sm font-black text-white shadow-xl"
              >
                <Lock
                  size={
                    15
                  }
                />

                {
                  lockedMessage
                }
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* LOADING */}

        {loading && (
          <div className="flex min-h-[400px] items-center justify-center">
            <p className="text-lg font-black text-slate-500">
              جاري تحميل الفئات...
            </p>
          </div>
        )}

        {/* ERROR */}

        {!loading &&
          error && (
            <div className="flex min-h-[400px] items-center justify-center">

              <div className="rounded-3xl border border-red-200 bg-red-50 px-8 py-6 text-center shadow-sm">

                <p className="font-black text-red-600">
                  {error}
                </p>

              </div>

            </div>
          )}

        {/* CATEGORIES */}

        {!loading &&
          !error && (
            <div
              className="
                mx-auto
                mt-8
                grid
                w-full
                grid-cols-1
                gap-5
                pb-32
                sm:grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-4
              "
            >

              {categories.map(
                (
                  category,
                  index
                ) => {
                  const Icon =
                    category.icon;

                  const isLocked =
                    category.isFree ===
                    false;

                  const isSelected =
                    selected.some(
                      (item) =>
                        item.id ===
                        category.id
                    );

                  const maxSelected =
                    selected.length ===
                      3 &&
                    !isSelected;

                  return (
                    <motion.button
                      key={
                        category.id
                      }

                      type="button"

                      initial={{
                        opacity:
                          0,

                        y:
                          16,
                      }}

                      animate={{
                        opacity:
                          1,

                        y:
                          0,
                      }}

                      transition={{
                        delay:
                          index *
                          0.035,
                      }}

                      whileHover={
                        !isLocked &&
                        !maxSelected
                          ? {
                              y:
                                -5,
                            }
                          : {}
                      }

                      whileTap={
                        !isLocked &&
                        !maxSelected
                          ? {
                              scale:
                                0.98,
                            }
                          : {}
                      }

                      onClick={() => {
                        if (
                          isLocked
                        ) {
                          showLockedMessage(
                            category
                          );

                          return;
                        }

                        toggleCategory(
                          category
                        );
                      }}

                      className={`group relative flex min-h-[280px] flex-col overflow-hidden rounded-[30px] border p-6 text-right transition-all duration-300
                        ${
                          isLocked
                            ? "cursor-not-allowed border-slate-200 bg-white/70 shadow-sm"
                            : isSelected
                            ? "border-orange-300 bg-orange-50/80 shadow-[0_18px_45px_rgba(249,115,22,0.16)]"
                            : "border-orange-100/70 bg-white/95 shadow-[0_10px_30px_rgba(249,115,22,0.08)] hover:border-orange-200 hover:shadow-[0_20px_45px_rgba(249,115,22,0.14)]"
                        }

                        ${
                          maxSelected &&
                          !isLocked
                            ? "cursor-not-allowed opacity-35"
                            : ""
                        }
                      `}
                    >

                      {/* TOP LINE */}

                      <div
                        className={`absolute inset-x-0 top-0 h-1 ${
                          isLocked
                            ? "bg-gradient-to-l from-slate-400 via-slate-300 to-slate-200"
                            : "bg-gradient-to-l from-orange-500 via-amber-400 to-orange-200"
                        }`}
                      />

                      {/* LOCKED OVERLAY */}

                      {isLocked && (
                        <div className="pointer-events-none absolute inset-0 bg-slate-100/25 backdrop-grayscale-[20%]" />
                      )}

                      {/* LOCK BADGE */}

                      {isLocked && (
                        <div className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-500 shadow-sm">

                          <Lock
                            size={
                              13
                            }
                            strokeWidth={
                              2.7
                            }
                          />

                          مقفلة
                        </div>
                      )}

                      {/* SELECTED CHECK */}

                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{
                              scale:
                                0,
                            }}
                            animate={{
                              scale:
                                1,
                            }}
                            exit={{
                              scale:
                                0,
                            }}
                            className="absolute left-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-l from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-200"
                          >
                            <Check
                              size={
                                18
                              }
                              strokeWidth={
                                3
                              }
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* ICON */}

                      <div
                        className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border shadow-sm ${
                          isLocked
                            ? "border-slate-200 bg-slate-100 text-slate-400"
                            : "border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 text-orange-500"
                        }`}
                      >
                        <Icon
                          size={
                            29
                          }
                        />

                        {isLocked && (
                          <div className="absolute -bottom-2 -left-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-700 text-white shadow-md">

                            <Lock
                              size={
                                12
                              }
                              strokeWidth={
                                3
                              }
                            />

                          </div>
                        )}
                      </div>

                      {/* NAME */}

                      <h2
                        className={`relative mt-6 text-2xl font-black ${
                          isLocked
                            ? "text-slate-600"
                            : "text-slate-950"
                        }`}
                      >
                        {
                          category.name
                        }
                      </h2>

                      {/* DESCRIPTION */}

                      <p
                        className={`relative mt-3 text-sm leading-7 ${
                          isLocked
                            ? "text-slate-400"
                            : "text-slate-600"
                        }`}
                      >
                        {
                          category.description
                        }
                      </p>

                      {/* QUESTION COUNT */}

                      {!isLocked && (
                        <div className="relative mt-4 w-fit rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-extrabold text-orange-600">
                          {
                            category.questionCount
                          }{" "}
                          أسئلة
                        </div>
                      )}

                      {/* LOCKED STATUS */}

                      {isLocked && (
                        <div className="relative mt-4 flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500">

                          <Lock
                            size={
                              12
                            }
                          />

                          ستتوفر لاحقًا
                        </div>
                      )}

                      {/* BOTTOM ACTION */}

                      <div
                        className={`relative mt-auto flex items-center gap-2 pt-6 font-black transition ${
                          isLocked
                            ? "text-slate-400"
                            : isSelected
                            ? "text-orange-600"
                            : "text-slate-500 group-hover:text-orange-500"
                        }`}
                      >

                        {isLocked ? (
                          <>
                            <span>
                              فئة مقفلة
                            </span>

                            <Lock
                              size={
                                16
                              }
                            />
                          </>
                        ) : isSelected ? (
                          <>
                            <span>
                              تم الاختيار
                            </span>

                            <Check
                              size={
                                17
                              }
                            />
                          </>
                        ) : (
                          <>
                            <span>
                              اختر الفئة
                            </span>

                            <ArrowLeft
                              size={
                                17
                              }
                            />
                          </>
                        )}

                      </div>

                    </motion.button>
                  );
                }
              )}

            </div>
          )}

{/* FLOATING CONTINUE BUTTON */}

<AnimatePresence>
  {selected.length === 3 && (
    <motion.div
      initial={{
        opacity: 0,
        y: 30,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: 30,
      }}
      className="
        pointer-events-none
        fixed
        inset-x-0
        bottom-6
        z-30
        flex
        justify-center
        px-5
      "
    >
      <motion.button
        initial={{
          scale: 0.94,
        }}
        animate={{
          scale: 1,
        }}
        whileHover={{
          scale: 1.03,
          y: -2,
        }}
        whileTap={{
          scale: 0.98,
        }}
        onClick={() =>
          onContinue(selected)
        }
        className="
          pointer-events-auto
          rounded-full
          border
          border-white/70
          bg-gradient-to-l
          from-orange-500
          to-amber-400
          px-12
          py-4
          text-base
          font-black
          text-white
          shadow-[0_20px_55px_rgba(249,115,22,0.35)]
          backdrop-blur-xl
        "
      >
        متابعة إلى أسماء الفرق
      </motion.button>
    </motion.div>
  )}
</AnimatePresence>

      </div>
    </section>
  );
}