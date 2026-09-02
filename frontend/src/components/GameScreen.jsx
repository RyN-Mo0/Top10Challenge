import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowLeftRight,
  Timer,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import BrandLogo from "./BrandLogo";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function GameScreen({ gameSetup, onExit }) {
  const [sessionId, setSessionId] = useState(null);
  const [sessionStarting, setSessionStarting] = useState(true);
  const [sessionStartError, setSessionStartError] = useState("");

  const [currentCategory, setCurrentCategory] = useState(null);
  const [categoryChallenges, setCategoryChallenges] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState("");
  const [completedCategories, setCompletedCategories] = useState([]);
  const [questionInCategory, setQuestionInCategory] = useState(0);
  const [totalQuestionsPlayed, setTotalQuestionsPlayed] = useState(0);

  const [activeTeam, setActiveTeam] = useState(0);

  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const [showSkipQuestionConfirm, setShowSkipQuestionConfirm] =
    useState(false);

  const [showExitConfirm, setShowExitConfirm] =
    useState(false);

  // نتيجة الفئة الحالية قبل الانتقال للفئة التالية
  const [categoryResult, setCategoryResult] = useState(null);

  // بعد انتهاء الفئات الثلاث
  const [gameFinished, setGameFinished] = useState(false);

    const [timerDuration, setTimerDuration] = useState(20);
    const [timeLeft, setTimeLeft] = useState(20);
    const [timerRunning, setTimerRunning] = useState(false);

    useEffect(() => {
  if (!timerRunning || timeLeft <= 0) return;

  const timer = setInterval(() => {
    setTimeLeft((current) => {
      if (current <= 1) {
        setTimerRunning(false);
        return 0;
      }

      return current - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [timerRunning, timeLeft]);

const resetTimer = () => {
  setTimeLeft(timerDuration);
  setTimerRunning(false);
};

  /*
    عدد البونصات لكل فريق.
    مثال:
    [2, 1]
    الفريق الأول أخذ بونصين
    الفريق الثاني أخذ بونص واحد
  */
  const [bonusWins, setBonusWins] = useState([0, 0]);

  const [scores, setScores] = useState([
    {
      total: 0,
      category: 0,
    },
    {
      total: 0,
      category: 0,
    },
  ]);

  const teams = useMemo(
    () => [
      {
        name: gameSetup.team1,
      },
      {
        name: gameSetup.team2,
      },
    ],
    [gameSetup]
  );

  useEffect(() => {
    let cancelled = false;

    const startSession = async () => {
      try {
        setSessionStarting(true);
        setSessionStartError("");

        const response = await fetch(`${API_BASE}/api/start-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teams: [
              gameSetup.team1,
              gameSetup.team2,
            ],
            categories:
              gameSetup.categories.map(
                (category) =>
                  category.id
              ),
          }),
        });

        if (!response.ok) {
          throw new Error(
            "تعذر بدء جلسة المباراة"
          );
        }

        const data =
          await response.json();

        if (!cancelled) {
          setSessionId(
            data.sessionId
          );

          setScores(data.scores);
          setBonusWins(
            data.bonusWins
          );

          setCompletedCategories(
            data.completedCategories
          );
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setSessionStartError(
            "تعذر بدء المباراة. تأكد أن الـ Backend يعمل."
          );
        }
      } finally {
        if (!cancelled) {
          setSessionStarting(false);
        }
      }
    };

    startSession();

    return () => {
      cancelled = true;
    };
  }, [gameSetup]);

  const endSessionAndExit = async () => {
    try {
      await fetch(`${API_BASE}/api/end-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });
    } catch (error) {
      console.error("تعذر حذف جلسة المباراة من السيرفر", error);
    } finally {
      onExit();
    }
  };

  if (sessionStarting) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"
      >
        <div className="rounded-[28px] border border-slate-200 bg-white px-10 py-8 text-center shadow-sm">
          <p className="text-lg font-black text-slate-800">
            جاري تجهيز المباراة...
          </p>
        </div>
      </div>
    );
  }

  if (sessionStartError || !sessionId) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"
      >
        <div className="w-full max-w-md rounded-[28px] border border-red-100 bg-white p-8 text-center shadow-sm">
          <p className="font-black text-red-500">
            {sessionStartError ||
              "تعذر بدء المباراة"}
          </p>

          <button
            onClick={onExit}
            className="mt-5 rounded-full bg-slate-950 px-7 py-3 font-black text-white"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const availableCategories = gameSetup.categories.filter(
    (category) =>
      !completedCategories.includes(category.id)
  );

  /*
    بعد انتهاء الفئات الثلاث: النتيجة النهائية
  */
  if (gameFinished) {
    return (
      <FinalResultScreen
        teams={teams}
        scores={scores}
        bonusWins={bonusWins}
        onExit={endSessionAndExit}
      />
    );
  }

  /*
    بعد كل فئة: إعلان الفائز بالبونص قبل المتابعة
  */
  if (categoryResult) {
    return (
      <CategoryResultScreen
        result={categoryResult}
        teams={teams}
        scores={scores}
        bonusWins={bonusWins}
        onContinue={() => {
          if (categoryResult.isLastCategory) {
            setCategoryResult(null);
            setGameFinished(true);
          } else {
            setCategoryResult(null);
          }
        }}
      />
    );
  }

  /*
    شاشة اختيار الفئة بين الجولات
  */
  if (!currentCategory) {
    return (
      <>
        <CategoryPicker
          categories={availableCategories}
          completedCount={completedCategories.length}
          teams={teams}
          scores={scores}
          bonusWins={bonusWins}
          loading={questionsLoading}
          error={questionsError}
          onSelect={async (category) => {
            setQuestionsLoading(true);
            setQuestionsError("");
            setQuestionInCategory(0);
            setRevealed([]);
            setFeedback(null);
            setInput("");
            setTimeLeft(timerDuration);
            setTimerRunning(false);

            setScores((current) =>
              current.map((team) => ({
                ...team,
                category: 0,
              }))
            );

            try {
              const params = new URLSearchParams({
                category: category.id,
                count: "2",
              });

              const response = await fetch(
                `${API_BASE}/api/session/${sessionId}/questions?${params.toString()}`
              );

              if (!response.ok) {
                const errorData =
                  await response
                    .json()
                    .catch(() => ({}));

                throw new Error(
                  errorData.error ||
                    "فشل تحميل أسئلة الفئة"
                );
              }

              const questions =
                await response.json();

              if (
                !Array.isArray(
                  questions
                ) ||
                questions.length < 2
              ) {
                throw new Error(
                  "هذه الفئة لا تحتوي على سؤالين حاليًا"
                );
              }

              setCategoryChallenges(
                questions.slice(0, 2)
              );

              setCurrentCategory(
                category
              );
            } catch (error) {
              console.error(error);
              setCategoryChallenges([]);
              setQuestionsError(
                error.message || "تعذر الاتصال بالخادم"
              );
            } finally {
              setQuestionsLoading(false);
            }
          }}
          onExit={() => setShowExitConfirm(true)}
        />

        <ExitConfirmModal
          open={showExitConfirm}
          onClose={() => setShowExitConfirm(false)}
          onConfirm={endSessionAndExit}
        />
      </>
    );
  }

  const challenge =
    categoryChallenges[questionInCategory] ||
    categoryChallenges[0];

  if (!challenge) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"
      >
        <div className="rounded-3xl bg-white p-10 text-center shadow-xl">
          <h2 className="text-2xl font-black">
            لا توجد أسئلة لهذه الفئة حاليًا
          </h2>

          <button
            onClick={() => setCurrentCategory(null)}
            className="mt-6 rounded-2xl bg-indigo-600 px-7 py-3 font-bold text-white"
          >
            الرجوع
          </button>
        </div>
      </div>
    );
  }

  const switchTeam = () => {
    setActiveTeam((current) =>
      current === 0 ? 1 : 0
    );
  };

  const checkAnswer = async () => {
    const value = input.trim();

    if (!value || !challenge) return;

    const nextTeamIndex =
      activeTeam === 0 ? 1 : 0;

    const nextTeam =
      teams[nextTeamIndex].name;

    try {
      const response = await fetch(`${API_BASE}/api/check-answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          questionId: challenge.id,
          answer: value,
          teamIndex: activeTeam,
        }),
      });

      if (!response.ok) {
        throw new Error("تعذر التحقق من الإجابة");
      }

      const result = await response.json();

      if (!result.correct) {
        setFeedback({
          type: "wrong",
          text: `إجابة غير صحيحة — الدور الآن لـ ${nextTeam}`,
        });

        setInput("");
        switchTeam();
        return;
      }

      if (
        result.duplicate ||
        revealed.some((item) => item.rank === result.rank)
      ) {
        setFeedback({
          type: "wrong",
          text: `هذه الإجابة مكتشفة مسبقًا — الدور الآن لـ ${nextTeam}`,
        });

        setInput("");
        switchTeam();
        return;
      }

      setRevealed((current) => [
        ...current,
        {
          rank: result.rank,
          answer: result.answer,
          description:
            result.description ||
            "",
        },
      ]);

      setScores(result.scores);
      setBonusWins(result.bonusWins);

      setFeedback({
        type: "correct",
        text: `إجابة صحيحة! +${result.points} نقاط — الدور الآن لـ ${nextTeam}`,
      });

      setInput("");
      switchTeam();
    } catch (error) {
      console.error(error);
      setFeedback({
        type: "info",
        text: "تعذر الاتصال بالخادم. تأكد أن الـ Backend يعمل على المنفذ 3000.",
      });
    }
  };

  /*
    تمرير الدور:
    صار Info عادي، بدون أحمر وبدون X.
  */
  const skipTurn = () => {
    const nextTeam =
      teams[activeTeam === 0 ? 1 : 0].name;

    setFeedback({
      type: "info",
      text: `تم تمرير الدور إلى ${nextTeam}`,
    });

    setInput("");

    // عند تمرير الدور: يرجع المؤقت للمدة المختارة ويبدأ مباشرة
    setTimeLeft(timerDuration);
    setTimerRunning(true);

    switchTeam();
  };

  const finishQuestion = () => {
    /*
      السؤال الأول -> الثاني
    */
    if (questionInCategory === 0) {
      setQuestionInCategory(1);

      setTotalQuestionsPlayed(
        (current) => current + 1
      );

      setRevealed([]);
      setFeedback(null);
      setInput("");
      setTimeLeft(timerDuration);
      setTimerRunning(false);

      return;
    }

    /*
      السؤال الثاني -> نهاية الفئة
    */
    finishCategory();
  };

  const finishCategory = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/finish-category`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            sessionId,
            categoryId:
              currentCategory.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => ({}));

        throw new Error(
          errorData.error ||
            "تعذر إنهاء الفئة"
        );
      }

      const data =
        await response.json();

      setScores(data.scores);

      setBonusWins(
        data.bonusWins
      );

      setCompletedCategories(
        data.completedCategories
      );

      setCategoryResult({
        ...data.categoryResult,
        categoryName:
          currentCategory.name,
      });

      setTotalQuestionsPlayed(
        (current) => current + 1
      );

      setCurrentCategory(null);
      setQuestionInCategory(0);
      setCategoryChallenges([]);
      setRevealed([]);
      setFeedback(null);
      setInput("");
      setTimeLeft(timerDuration);
      setTimerRunning(false);
    } catch (error) {
      console.error(error);

      setFeedback({
        type: "info",
        text:
          "تعذر إنهاء الفئة من السيرفر. حاول مرة أخرى.",
      });
    }
  };

  const answerSlots = Array.from({ length: 10 }, (_, index) => {
    const rank = index + 1;
    const found = revealed.find((item) => item.rank === rank);

    return {
      rank,
      answer:
        found?.answer || "",
      description:
        found?.description || "",
    };
  });

  const rightAnswers = answerSlots.slice(0, 5);
  const leftAnswers = answerSlots.slice(5, 10);

  const allAnswersRevealed =
    new Set(revealed.map((item) => item.rank)).size === 10;

  return (
    <section
      dir="rtl"
      className="min-h-screen bg-[#F8FAFC] px-4 py-3 text-slate-900 lg:h-screen lg:overflow-hidden"
    >
      <div className="mx-auto flex h-full max-w-[1500px] flex-col">

        {/* TOP BAR */}
        <header className="flex shrink-0 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandLogo size={40} showText={false} />

            <span className="inline-flex rounded-full bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-600">
              {currentCategory.name}
            </span>

            <span className="hidden text-sm font-semibold text-slate-400 md:block">
              السؤال {totalQuestionsPlayed + 1} من 6
              {" • "}
              {questionInCategory + 1} من 2 في هذه الفئة
            </span>
          </div>

          <div className="flex items-center gap-2">

            {/* TIMER */}
            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition ${
                timeLeft === 0
                  ? "border-amber-300 bg-amber-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <Timer
                size={17}
                className={
                  timeLeft === 0
                    ? "text-amber-500"
                    : "text-indigo-500"
                }
              />

              <span
                className={`min-w-10 text-center text-sm font-black ${
                  timeLeft === 0
                    ? "text-amber-600"
                    : "text-slate-800"
                }`}
              >
                {timeLeft === 0 ? "انتهى" : `${timeLeft}ث`}
              </span>

              <button
                onClick={() => {
                  if (timeLeft === 0) {
                    setTimeLeft(timerDuration);
                  }
                  setTimerRunning((current) => !current);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                title={timerRunning ? "إيقاف المؤقت" : "تشغيل المؤقت"}
              >
                {timerRunning ? <Pause size={14} /> : <Play size={14} />}
              </button>

              <button
                onClick={resetTimer}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                title="إعادة ضبط المؤقت"
              >
                <RotateCcw size={14} />
              </button>

              <select
                value={timerDuration}
                onChange={(event) => {
                  const duration = Number(event.target.value);
                  setTimerDuration(duration);
                  setTimeLeft(duration);
                  setTimerRunning(false);
                }}
                className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-black text-indigo-600 outline-none"
                title="مدة المؤقت"
              >
                <option value={10}>10ث</option>
                <option value={20}>20ث</option>
                <option value={30}>30ث</option>
                <option value={45}>45ث</option>
                <option value={60}>60ث</option>
              </select>
            </div>

            {/* تمرير الدور */}
            <button
              onClick={skipTurn}
              disabled={allAnswersRevealed}
              className={`rounded-full border px-5 py-2 text-sm font-bold transition ${
                allAnswersRevealed
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              تمرير الدور
            </button>

            {/* السؤال التالي / إنهاء الفئة */}
            <motion.button
              key={`${challenge.id}-${questionInCategory}-next-button`}
              onClick={() => {
                if (allAnswersRevealed) {
                  finishQuestion();
                } else {
                  setShowSkipQuestionConfirm(true);
                }
              }}
              animate={
                allAnswersRevealed
                  ? {
                      boxShadow: [
                        "0 0 0 0 rgba(59,130,246,0)",
                        "0 0 0 8px rgba(59,130,246,0.22)",
                        "0 0 0 0 rgba(59,130,246,0)",
                      ],
                      scale: [1, 1.035, 1],
                    }
                  : {
                      boxShadow: "0 0 0 0 rgba(59,130,246,0)",
                      scale: 1,
                    }
              }
              transition={
                allAnswersRevealed
                  ? {
                      duration: 1.15,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
                  : {
                      duration: 0.15,
                      repeat: 0,
                    }
              }
              className={`rounded-full border px-5 py-2 text-sm font-black transition ${
                allAnswersRevealed
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
              }`}
            >
              {questionInCategory === 0
                ? "السؤال التالي"
                : "إنهاء الفئة"}
            </motion.button>

            {/* خروج - أحمر */}
            <button
              onClick={() =>
                setShowExitConfirm(true)
              }
              className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-black text-red-500 transition hover:border-red-300 hover:bg-red-100"
            >
              خروج
            </button>

          </div>
        </header>

        {/* QUESTION TITLE */}
        <div className="shrink-0 py-3 text-center">
          <h1 className="text-2xl font-black leading-tight sm:text-3xl lg:text-[38px]">
            {challenge.title}
          </h1>
        </div>

        {/*
          TOP 10 BOARD

          هذه الآن flex-1:
          يعني اللوحة تتمدد وتملأ المساحة المتبقية
          بدل ما يكون تحتها فراغ كبير.
        */}
        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">

          <div className="grid min-h-0 grid-rows-5 gap-2.5">
            {rightAnswers.map((item) => (
              <AnswerTile
                key={item.rank}
                item={item}
                revealed={Boolean(item.answer)}
              />
            ))}
          </div>

          <div className="grid min-h-0 grid-rows-5 gap-2.5">
            {leftAnswers.map((item) => (
              <AnswerTile
                key={item.rank}
                item={item}
                revealed={Boolean(item.answer)}
              />
            ))}
          </div>

        </div>

        {/* BOTTOM GAME AREA */}
        <div className="mt-3 grid shrink-0 gap-3 pb-1 lg:grid-cols-[0.9fr_1.5fr_0.9fr]">

          {/* Team 1 = Orange */}
          <TeamCard
            team={teams[0]}
            score={scores[0]}
            bonusCount={bonusWins[0]}
            active={activeTeam === 0}
            color="orange"
          />

          {/* INPUT */}
          <div className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-bold text-slate-400">
                دور
              </span>

              <span
                className={`text-lg font-black ${
                  activeTeam === 0
                    ? "text-orange-400"
                    : "text-sky-500"
                }`}
              >
                {teams[activeTeam].name}
              </span>
            </div>

            <div className="mt-2 flex gap-2">
              <input
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    checkAnswer();
                  }
                }}
                placeholder="اكتب إجابة الفريق..."
                className={`h-12 min-w-0 flex-1 rounded-xl border-2 px-4 outline-none transition ${
                  activeTeam === 0
                    ? "border-orange-200 focus:border-orange-400"
                    : "border-sky-200 focus:border-sky-500"
                }`}
              />

              <button
                onClick={checkAnswer}
                className={`rounded-xl px-7 font-black text-white shadow-md transition hover:-translate-y-0.5 ${
                  activeTeam === 0
                    ? "bg-gradient-to-l from-orange-400 to-amber-300"
                    : "bg-gradient-to-l from-sky-500 to-cyan-400"
                }`}
              >
                تحقق
              </button>
            </div>

            <AnimatePresence mode="wait">
              {feedback && (
                <motion.div
                  key={feedback.text}
                  initial={{
                    opacity: 0,
                    y: 5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                  }}
                  className={`mt-2 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-center text-xs font-bold ${
                    feedback.type === "correct"
                      ? "bg-emerald-50 text-emerald-600"
                      : feedback.type === "wrong"
                      ? "bg-red-50 text-red-500"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >

                  {feedback.type === "correct" && (
                    <CheckCircle2 size={16} />
                  )}

                  {feedback.type === "wrong" && (
                    <XCircle size={16} />
                  )}

                  {feedback.type === "info" && (
                    <ArrowLeftRight size={16} />
                  )}

                  {feedback.text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Team 2 = Sky */}
          <TeamCard
            team={teams[1]}
            score={scores[1]}
            bonusCount={bonusWins[1]}
            active={activeTeam === 1}
            color="sky"
          />

        </div>
      </div>

      {/* SKIP QUESTION CONFIRM */}
      <AnimatePresence>
        {showSkipQuestionConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() =>
              setShowSkipQuestionConfirm(false)
            }
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-5 backdrop-blur-sm"
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
                y: 15,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.97,
              }}
              onMouseDown={(event) =>
                event.stopPropagation()
              }
              className="w-full max-w-md rounded-[30px] bg-white p-7 text-center shadow-2xl"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
                ⚠️
              </div>

              <h2 className="mt-5 text-2xl font-black text-slate-950">
                {questionInCategory === 0
                  ? "متأكد من تخطي السؤال؟"
                  : "متأكد من إنهاء الفئة؟"}
              </h2>

              <p className="mt-3 leading-7 text-slate-500">
                {questionInCategory === 0
                  ? "سيتم الانتقال للسؤال الثاني ولن يمكن الرجوع إلى الإجابات المتبقية."
                  : "سيتم إنهاء هذه الفئة وحساب البونص ولن يمكن الرجوع إلى السؤال."}
              </p>

              <button
                onClick={() => {
                  setShowSkipQuestionConfirm(false);
                  finishQuestion();
                }}
                className="mt-7 h-14 w-full rounded-2xl bg-gradient-to-l from-indigo-600 to-cyan-500 font-black text-white"
              >
                {questionInCategory === 0
                  ? "نعم، انتقل للسؤال التالي"
                  : "نعم، أنهِ الفئة"}
              </button>

              <button
                onClick={() =>
                  setShowSkipQuestionConfirm(false)
                }
                className="mt-3 h-12 w-full rounded-2xl border border-slate-200 font-bold text-slate-500"
              >
                رجوع
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXIT CONFIRM */}
      <ExitConfirmModal
        open={showExitConfirm}
        onClose={() =>
          setShowExitConfirm(false)
        }
        onConfirm={endSessionAndExit}
      />
    </section>
  );
}

/*
  شاشة نهاية الفئة وإعلان صاحب البونص
*/
function CategoryResultScreen({
  result,
  teams,
  scores,
  bonusWins,
  onContinue,
}) {
  const isDraw = result.winner === null;

  return (
<section
  dir="rtl"
  className="relative h-[100dvh] overflow-hidden bg-[#F8FAFC] px-5"
>
  {/* نفس خلفية الـ Hero */}
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute -right-36 -top-40 h-[520px] w-[520px] rounded-full bg-indigo-200/45 blur-[90px]" />
    <div className="absolute -left-28 top-[28%] h-[430px] w-[430px] rounded-full bg-cyan-200/45 blur-[95px]" />
    <div className="absolute left-[42%] top-[58%] h-[340px] w-[340px] rounded-full bg-violet-200/30 blur-[90px]" />
  </div>

  <div className="relative mx-auto flex h-full max-w-[1550px] flex-col">

    <header className="flex h-24 shrink-0 items-center justify-between">
      <BrandLogo />

      <span className="rounded-full border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-bold text-slate-500 shadow-sm backdrop-blur">
        انتهت فئة {result.categoryName}
      </span>
    </header>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-violet-50 text-3xl shadow-sm">
            {isDraw ? "❇️" : "🎖️"}
          </div>

          <p className="mt-3 text-sm font-black text-indigo-600">
            نتيجة الفئة
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
            {isDraw
              ? "تعادل في هذه الفئة!"
              : `${teams[result.winner].name} حسموا الفئة!`}
          </h1>

          <p className="mt-2 text-base text-slate-500">
            {isDraw
              ? "لا يوجد بونص لهذه الفئة."
              : "الفريق المتفوق في مجموع السؤالين يحصل على بونص."}
          </p>

          {!isDraw && (
            <motion.div
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 240 }}
              className="mt-4 rounded-full bg-amber-50 px-6 py-2 text-xl font-black text-amber-600"
            >
              🎖️ +10
            </motion.div>
          )}

          <div className="mt-5 grid w-full max-w-3xl grid-cols-2 gap-4">
            {teams.map((team, index) => {
              const isOrange = index === 0;
              const isWinner = result.winner === index;

              return (
                <div
                  key={team.name}
                  className={`relative rounded-[26px] border bg-white p-5 shadow-sm ${
                    isWinner
                      ? isOrange
                        ? "border-orange-300 ring-4 ring-orange-100"
                        : "border-sky-300 ring-4 ring-sky-100"
                      : "border-slate-200"
                  }`}
                >
                  {isWinner && (
                    <span className="absolute left-4 top-4 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-600">
                      🎖️ +10
                    </span>
                  )}

                  <p
                    className={`text-lg font-black ${
                      isOrange
                        ? "text-orange-400"
                        : "text-sky-500"
                    }`}
                  >
                    {team.name}
                  </p>

                  <p className="mt-4 text-xs font-bold text-slate-400">
                    نقاط هذه الفئة
                  </p>

                  <p
                    className={`mt-1 text-4xl font-black ${
                      isOrange
                        ? "text-orange-400"
                        : "text-sky-500"
                    }`}
                  >
                    {result.teamCategoryScores[index]}
                  </p>

                  <div className="mt-3 flex items-center justify-center gap-2">
                    <span className="text-xs font-bold text-slate-400">
                      المجموع العام:
                    </span>
                    <span className="font-black text-slate-800">
                      {scores[index].total}
                    </span>
                  </div>

                  {bonusWins[index] > 0 && (
                    <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                      {Array.from({
                        length: bonusWins[index],
                      }).map((_, bonusIndex) => (
                        <span
                          key={bonusIndex}
                          className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-600"
                        >
                          🎖️ +10
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={onContinue}
            className="mt-5 rounded-full bg-gradient-to-l from-indigo-600 to-cyan-500 px-9 py-3.5 text-base font-black text-white shadow-xl shadow-indigo-100 transition hover:-translate-y-0.5"
          >
            {result.isLastCategory
              ? "عرض النتيجة النهائية"
              : "اختيار الفئة التالية"}
          </button>
        </div>
      </div>
    </section>
  );
}

/*
  شاشة النتيجة النهائية بعد 3 فئات / 6 أسئلة
*/
function FinalResultScreen({
  teams,
  scores,
  bonusWins,
  onExit,
}) {
  let winner = null;

  if (scores[0].total > scores[1].total) {
    winner = 0;
  } else if (scores[1].total > scores[0].total) {
    winner = 1;
  }

  const isDraw = winner === null;

  return (
    <section
      dir="rtl"
      className="relative h-[100dvh] overflow-hidden bg-[#F8FAFC] px-4 py-4 md:px-6"
    >
      {/* خلفية احتفالية تظهر فقط عند وجود فائز */}
      {!isDraw && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 top-10 h-56 w-56 rounded-full bg-orange-100/70 blur-3xl" />
          <div className="absolute -left-16 bottom-8 h-60 w-60 rounded-full bg-sky-100/70 blur-3xl" />
          <div className="absolute left-1/3 top-1/4 h-44 w-44 rounded-full bg-violet-100/60 blur-3xl" />

          {[
            "🎉","🎆","🎊","🎆","🎉","🎊","🎆","🎉","🎊","🎆","🎉","🎆"
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ y: -40, opacity: 0.2, rotate: 0 }}
              animate={{ y: [0, 18, 0], opacity: [0.35, 0.8, 0.35], rotate: [0, 12, -12, 0] }}
              transition={{
                duration: 3 + (index % 3),
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.15,
              }}
              className="absolute text-2xl"
              style={{
                top: `${8 + (index % 4) * 18}%`,
                left: `${6 + index * 7}%`,
              }}
            >
              {item}
            </motion.div>
          ))}
        </div>
      )}

      <div className="relative mx-auto flex h-full max-w-5xl flex-col">
        <header className="flex shrink-0 items-center justify-between">
          <BrandLogo
            size={44}
            showSubtitle={false}
            titleClassName="text-lg"
          />

          <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-600">
            6 من 6 أسئلة
          </span>
        </header>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-violet-50 text-3xl shadow-sm">
            {isDraw ? "❇️" : "👑"}
          </div>

          <p className="mt-3 font-black text-indigo-600">
            انتهت المباراة
          </p>

          <h1 className="mt-2 text-4xl font-black text-slate-950 sm:text-5xl">
            {isDraw
              ? "تعادل!"
              : `${teams[winner].name} أبطال التحدي!`}
          </h1>

          <p className="mt-2 text-base text-slate-500">
            النتيجة النهائية بعد 3 فئات و6 أسئلة
          </p>

          <div className="mt-6 grid w-full max-w-3xl grid-cols-2 gap-4">
            {teams.map((team, index) => {
              const isOrange = index === 0;
              const isWinner = winner === index;

              return (
                <motion.div
                  key={team.name}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`rounded-[28px] border bg-white/95 p-6 shadow-sm backdrop-blur-sm ${
                    isWinner
                      ? isOrange
                        ? "border-orange-300 ring-4 ring-orange-100"
                        : "border-sky-300 ring-4 ring-sky-100"
                      : "border-slate-200"
                  }`}
                >
                  <p
                    className={`text-xl font-black ${
                      isOrange
                        ? "text-orange-400"
                        : "text-sky-500"
                    }`}
                  >
                    {team.name}
                  </p>

                  <p
                    className={`mt-4 text-6xl font-black ${
                      isOrange
                        ? "text-orange-400"
                        : "text-sky-500"
                    }`}
                  >
                    {scores[index].total}
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-400">
                    نقطة
                  </p>

                  <div className="mt-5 flex min-h-8 flex-wrap justify-center gap-2">
                    {bonusWins[index] > 0 ? (
                      Array.from({
                        length: bonusWins[index],
                      }).map((_, bonusIndex) => (
                        <span
                          key={bonusIndex}
                          className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-600"
                        >
                          🎖️ +10
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-bold text-slate-300">
                        بدون بونص
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <button
            onClick={onExit}
            className="mt-6 rounded-full bg-slate-950 px-10 py-4 font-black text-white transition hover:-translate-y-0.5"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    </section>
  );
}

/*
  اختيار الفئة بين الجولات
*/
function CategoryPicker({
  categories,
  completedCount,
  teams,
  scores,
  bonusWins,
  loading,
  error,
  onSelect,
  onExit,
}) {
  return (
    <section
      dir="rtl"
      className="h-screen overflow-hidden bg-[#F8FAFC] px-5 py-3 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex h-full max-w-6xl flex-col">

        {/* TOP BAR */}
        <header className="flex h-[76px] shrink-0 items-center justify-between gap-4">
          <BrandLogo
            size={48}
            titleClassName="text-lg sm:text-xl"
            subtitleClassName="text-[11px] sm:text-xs"
          />

          <button
            onClick={onExit}
            className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-black text-red-500 transition hover:bg-red-100"
          >
            خروج
          </button>
        </header>

        {/* HERO */}
        <div className="shrink-0 text-center">
          <span className="inline-flex rounded-full border border-orange-100 bg-orange-50 px-4 py-1.5 text-xs font-black text-orange-600">
            {completedCount === 0
              ? "بداية المباراة"
              : `${completedCount} من 3 فئات مكتملة`}
          </span>

          <h1 className="mt-2.5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-[42px]">
            {completedCount === 0
              ? "بأي فئة تبدأون؟"
              : "اختاروا الفئة التالية"}
          </h1>

          <p className="mt-2 text-sm font-medium text-slate-500 sm:text-base">
            سؤالان لكل فئة، والفائز بمجموعهما يحصل على +10 بونص.
          </p>
        </div>

        {/* SCOREBOARD */}
        <div className="mx-auto mt-3.5 grid w-full max-w-4xl shrink-0 grid-cols-2 gap-3 sm:gap-4">
          {teams.map((team, index) => {
            const isTeamOne = index === 0;

            return (
              <div
                key={team.name}
                className={`rounded-[22px] border bg-white px-5 py-3 shadow-sm ${
                  isTeamOne
                    ? "border-orange-200"
                    : "border-sky-200"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p
                      className={`truncate text-base font-black sm:text-lg ${
                        isTeamOne
                          ? "text-orange-500"
                          : "text-sky-500"
                      }`}
                    >
                      {team.name}
                    </p>

                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400 sm:text-xs">
                      المجموع العام
                    </p>
                  </div>

                  <span
                    className={`shrink-0 text-3xl font-black sm:text-4xl ${
                      isTeamOne
                        ? "text-orange-500"
                        : "text-sky-500"
                    }`}
                  >
                    {scores[index].total}
                  </span>
                </div>

                {bonusWins[index] > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {Array.from({ length: bonusWins[index] }).map(
                      (_, bonusIndex) => (
                        <span
                          key={bonusIndex}
                          className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-600"
                        >
                          🎖️ +10
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CATEGORIES */}
        <div
          className={`mx-auto mt-3.5 grid w-full gap-4 ${
            categories.length === 1
              ? "max-w-sm grid-cols-1"
              : categories.length === 2
              ? "max-w-2xl grid-cols-2"
              : "max-w-5xl grid-cols-3"
          }`}
        >
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <motion.button
                key={category.id}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => onSelect(category)}
                disabled={loading}
                className="group relative min-h-[235px] overflow-hidden rounded-[28px] border border-orange-100/80 bg-white px-6 py-5 text-center shadow-[0_8px_28px_rgba(15,23,42,0.06)] transition hover:border-orange-200 hover:shadow-[0_16px_38px_rgba(249,115,22,0.12)] disabled:cursor-wait disabled:opacity-60"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-orange-500 via-amber-400 to-orange-200" />

                {Icon && (
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 text-orange-500 shadow-sm">
                    <Icon size={25} />
                  </div>
                )}

                <h2 className="mt-4 text-xl font-black text-slate-950 sm:text-2xl">
                  {category.name}
                </h2>

                <div className="mx-auto mt-2.5 w-fit rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-extrabold text-orange-600">
                  سؤالان
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 font-black text-orange-600">
                  {loading ? "جاري تحميل الأسئلة..." : "ابدأ بهذه الفئة"}
                  {!loading && <ArrowLeft size={17} />}
                </div>
              </motion.button>
            );
          })}
        </div>

        {error && (
          <div className="mx-auto mt-2.5 w-full max-w-xl rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm font-bold text-red-500">
            {error}
          </div>
        )}

        {/* PROGRESS */}
        <div className="mt-auto shrink-0 pt-2 text-center">
          <p className="text-xs font-bold text-slate-400">
            تم لعب {completedCount * 2} من 6 أسئلة
          </p>
        </div>
      </div>
    </section>
  );
}

/*
  بطاقة الإجابة.

  h-full يجعل كل البطاقات تتمدد لملء المساحة.
*/
function AnswerTile({
  item,
  revealed,
}) {
  return (
    <motion.div
      layout
      animate={
        revealed
          ? {
              scale: [
                1,
                1.015,
                1,
              ],
            }
          : {}
      }
      className={`flex h-full min-h-[62px] items-center rounded-[20px] border px-5 shadow-sm transition ${
        revealed
          ? "border-indigo-300 bg-gradient-to-l from-indigo-50 to-cyan-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-black ${
          revealed
            ? "bg-gradient-to-br from-indigo-600 to-cyan-500 text-white"
            : "bg-slate-100 text-slate-700"
        }`}
      >
        {item.rank}
      </div>

      {revealed ? (
        <>
          <div className="mr-4 min-w-0 flex-1">
            <p className="text-lg font-black leading-tight text-slate-900">
              {item.answer}
            </p>

            {item.description && (
              <p
                className="mt-1 line-clamp-2 whitespace-normal break-words text-[11px] font-semibold leading-4 text-slate-500 sm:text-xs"
                title={item.description}
              >
                {item.description}
              </p>
            )}
          </div>

          <span className="mr-2 shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-600 sm:text-sm">
            {item.rank} نقاط
          </span>
        </>
      ) : (
        <div className="mr-4 flex flex-1 items-center gap-3">
          <Lock
            size={18}
            className="text-slate-300"
          />

          <div className="h-3 w-32 rounded-full bg-slate-100" />
        </div>
      )}
    </motion.div>
  );
}

/*
  بطاقة الفريق أثناء اللعب.

  Team 1 = Orange
  Team 2 = Sky
*/
function TeamCard({
  team,
  score,
  active,
  color,
  bonusCount,
}) {
  const isOrange =
    color === "orange";

  return (
    <div
      className={`rounded-[22px] border bg-white p-4 shadow-sm transition ${
        active
          ? isOrange
            ? "border-orange-300 ring-4 ring-orange-100"
            : "border-sky-400 ring-4 ring-sky-100"
          : isOrange
          ? "border-orange-100"
          : "border-sky-100"
      }`}
    >
      <div className="flex items-center justify-between gap-2">

        <h3
          className={`text-xl font-black ${
            isOrange
              ? "text-orange-400"
              : "text-sky-500"
          }`}
        >
          {team.name}
        </h3>

        {active && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-black ${
              isOrange
                ? "bg-orange-50 text-orange-500"
                : "bg-sky-50 text-sky-600"
            }`}
          >
            دوركم الآن ⚡
          </span>
        )}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <span
          className={`text-4xl font-black ${
            isOrange
              ? "text-orange-400"
              : "text-sky-500"
          }`}
        >
          {score.category}
        </span>

        <span className="pb-1 text-xs font-bold text-slate-400">
          نقطة في هذه الفئة
        </span>
      </div>

      {/* علامات البونص السابقة */}
      {bonusCount > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Array.from({
            length: bonusCount,
          }).map((_, index) => (
            <span
              key={index}
              className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-600"
            >
              +10
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/*
  تأكيد الخروج
*/
function ExitConfirmModal({
  open,
  onClose,
  onConfirm,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          onMouseDown={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/35 px-5 backdrop-blur-sm"
        >
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96,
              y: 15,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.97,
            }}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
            className="w-full max-w-md rounded-[30px] bg-white p-7 text-center shadow-2xl"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl">
              🚪
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              الخروج من المباراة؟
            </h2>

            <p className="mt-3 leading-7 text-slate-500">
              إذا خرجت الآن سيتم إنهاء المباراة الحالية وفقدان تقدمها.
            </p>

            <button
              onClick={onConfirm}
              className="mt-7 h-14 w-full rounded-2xl bg-red-500 font-black text-white transition hover:bg-red-600"
            >
              نعم، خروج
            </button>

            <button
              onClick={onClose}
              className="mt-3 h-12 w-full rounded-2xl border border-slate-200 font-bold text-slate-500 transition hover:bg-slate-50"
            >
              إلغاء
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}