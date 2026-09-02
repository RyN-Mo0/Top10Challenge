const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

const { findSmartAnswer } = require("./arabicMatcher");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ======================================================
// SUPABASE
// ======================================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error(
    "❌ بيانات Supabase غير موجودة داخل .env"
  );

  process.exit(1);
}

const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// ======================================================
// SUPABASE HELPERS
// ======================================================

async function getCategoriesFromDatabase() {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,is_free")
    .order("name", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

async function getQuestionCounts() {
  const { data, error } = await supabase
    .from("questions")
    .select("id,category_id");

  if (error) {
    throw error;
  }

  const counts = new Map();

  for (const question of data || []) {
    const current =
      counts.get(question.category_id) || 0;

    counts.set(
      question.category_id,
      current + 1
    );
  }

  return counts;
}

async function getQuestionsByCategory(
  categoryId
) {
  const { data, error } = await supabase
    .from("questions")
    .select(
      "id,category_id,title"
    )
    .eq(
      "category_id",
      categoryId
    );

  if (error) {
    throw error;
  }

  return data || [];
}

async function getAnswersForQuestion(
  questionId
) {
  const { data, error } = await supabase
    .from("answers")
    .select(
      "question_id,rank,answer,aliases,description"
    )
    .eq(
      "question_id",
      questionId
    )
    .order(
      "rank",
      {
        ascending: true,
      }
    );

  if (error) {
    throw error;
  }

  return (data || []).map(
    (item) => ({
      questionId:
        item.question_id,

      rank:
        Number(
          item.rank
        ),

      answer:
        item.answer,

      aliases:
        String(
          item.aliases || ""
        )
          .split("|")
          .map(
            (alias) =>
              alias.trim()
          )
          .filter(Boolean),

      description:
        item.description || "",
    })
  );
}

// ======================================================
// GAME SESSIONS
// ======================================================

const gameSessions =
  new Map();

function createSession({
  teams,
  categories,
}) {
  const sessionId =
    `game-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

  const session = {
    id:
      sessionId,

    teams,

    categories,

    usedQuestionIds:
      new Set(),

    revealedByQuestion:
      new Map(),

    scores: [
      {
        total: 0,
        category: 0,
      },
      {
        total: 0,
        category: 0,
      },
    ],

    bonusWins:
      [0, 0],

    completedCategories:
      [],

    createdAt:
      Date.now(),
  };

  gameSessions.set(
    sessionId,
    session
  );

  return session;
}

function getSession(
  sessionId
) {
  return gameSessions.get(
    sessionId
  );
}

function getPublicSessionState(
  session
) {
  return {
    sessionId:
      session.id,

    teams:
      session.teams,

    categories:
      session.categories,

    scores:
      session.scores,

    bonusWins:
      session.bonusWins,

    completedCategories:
      session.completedCategories,
  };
}

// ======================================================
// RANDOM
// ======================================================

function shuffleArray(items) {
  const result =
    [...items];

  for (
    let i =
      result.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() *
          (i + 1)
      );

    [
      result[i],
      result[j],
    ] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

// ======================================================
// SESSION CLEANUP
// ======================================================

const SESSION_MAX_AGE =
  12 *
  60 *
  60 *
  1000;

const cleanupTimer =
  setInterval(
    () => {
      const now =
        Date.now();

      for (
        const [
          sessionId,
          session,
        ]
        of gameSessions.entries()
      ) {
        if (
          now -
            session.createdAt >
          SESSION_MAX_AGE
        ) {
          gameSessions.delete(
            sessionId
          );
        }
      }
    },

    60 * 60 * 1000
  );

cleanupTimer.unref();

// ======================================================
// HEALTH
// ======================================================

app.get(
  "/",
  (req, res) => {
    res.json({
      ok: true,

      message:
        "Top10 Challenge API يعمل بنجاح",

      answerMatcher:
        "Smart Arabic Matcher V5",

      lockedCategories:
        true,

      descriptions:
        true,
    });
  }
);

// ======================================================
// CATEGORIES
// ======================================================

app.get(
  "/api/categories",
  async (req, res) => {
    try {
      const [
        categories,
        counts,
      ] =
        await Promise.all([
          getCategoriesFromDatabase(),
          getQuestionCounts(),
        ]);

      const result =
        categories.map(
          (category) => ({
            id:
              category.id,

            name:
              category.name,

            // false = مقفلة
            // true = مجانية
            isFree:
              category.is_free === true,

            questionCount:
              counts.get(
                category.id
              ) || 0,
          })
        );

      return res.json(
        result
      );
    } catch (error) {
      console.error(
        "GET /api/categories:",
        error
      );

      return res
        .status(500)
        .json({
          ok: false,

          error:
            "تعذر تحميل الفئات",
        });
    }
  }
);

// ======================================================
// START SESSION
// ======================================================

app.post(
  "/api/start-session",
  async (req, res) => {
    try {
      const {
        teams,
        categories,
      } = req.body;

      if (
        !Array.isArray(
          teams
        ) ||
        teams.length !==
          2 ||
        !teams.every(
          (name) =>
            typeof name ===
              "string" &&
            name.trim()
        ) ||
        !Array.isArray(
          categories
        ) ||
        categories.length !==
          3
      ) {
        return res
          .status(400)
          .json({
            ok: false,

            error:
              "يجب إرسال فريقين و3 فئات",
          });
      }

      const uniqueCategories =
        [
          ...new Set(
            categories
          ),
        ];

      if (
        uniqueCategories.length !==
        3
      ) {
        return res
          .status(400)
          .json({
            ok: false,

            error:
              "يجب اختيار 3 فئات مختلفة",
          });
      }

      // نجيب is_free أيضًا
      const {
        data:
          existingCategories,

        error,
      } =
        await supabase
          .from(
            "categories"
          )
          .select(
            "id,is_free"
          )
          .in(
            "id",
            uniqueCategories
          );

      if (error) {
        throw error;
      }

      if (
        (
          existingCategories ||
          []
        ).length !==
        3
      ) {
        return res
          .status(400)
          .json({
            ok: false,

            error:
              "إحدى الفئات المختارة غير موجودة",
          });
      }

      // حماية من اختيار فئة مقفلة
      const hasLockedCategory =
        existingCategories.some(
          (category) =>
            category.is_free !==
            true
        );

      if (
        hasLockedCategory
      ) {
        return res
          .status(403)
          .json({
            ok: false,

            error:
              "لا يمكن بدء المباراة بفئة مقفلة",
          });
      }

      const session =
        createSession({
          teams:
            teams.map(
              (name) =>
                name.trim()
            ),

          categories:
            uniqueCategories,
        });

      return res.json({
        ok: true,

        ...getPublicSessionState(
          session
        ),
      });
    } catch (error) {
      console.error(
        "POST /api/start-session:",
        error
      );

      return res
        .status(500)
        .json({
          ok: false,

          error:
            "تعذر بدء المباراة",
        });
    }
  }
);

// ======================================================
// GET SESSION
// ======================================================

app.get(
  "/api/session/:sessionId",
  (req, res) => {
    const session =
      getSession(
        req.params
          .sessionId
      );

    if (!session) {
      return res
        .status(404)
        .json({
          ok: false,

          error:
            "جلسة المباراة غير موجودة",
        });
    }

    return res.json({
      ok: true,

      ...getPublicSessionState(
        session
      ),
    });
  }
);

// ======================================================
// GET RANDOM QUESTIONS
// ======================================================

app.get(
  "/api/session/:sessionId/questions",
  async (req, res) => {
    try {
      const session =
        getSession(
          req.params
            .sessionId
        );

      if (!session) {
        return res
          .status(404)
          .json({
            ok: false,

            error:
              "جلسة المباراة غير موجودة",
          });
      }

      const category =
        String(
          req.query
            .category ||
            ""
        ).trim();

      const requestedCount =
        Math.max(
          1,

          Math.min(
            Number(
              req.query
                .count
            ) || 2,

            10
          )
        );

      if (
        !category ||
        !session
          .categories
          .includes(
            category
          )
      ) {
        return res
          .status(400)
          .json({
            ok: false,

            error:
              "الفئة غير صالحة لهذه المباراة",
          });
      }

      const databaseQuestions =
        await getQuestionsByCategory(
          category
        );

      const availableQuestions =
        databaseQuestions.filter(
          (question) =>
            !session
              .usedQuestionIds
              .has(
                question.id
              )
        );

      const selectedQuestions =
        shuffleArray(
          availableQuestions
        ).slice(
          0,
          requestedCount
        );

      if (
        selectedQuestions.length <
        requestedCount
      ) {
        return res
          .status(409)
          .json({
            ok: false,

            error:
              "لا توجد أسئلة كافية غير مستخدمة لهذه الفئة",
          });
      }

      selectedQuestions.forEach(
        (question) => {
          session
            .usedQuestionIds
            .add(
              question.id
            );
        }
      );

      /*
        لا نرسل:
        answers
        aliases
        description
        قبل كشف الإجابة.
      */

      return res.json(
        selectedQuestions.map(
          (question) => ({
            id:
              question.id,

            categoryId:
              question
                .category_id,

            title:
              question.title,
          })
        )
      );
    } catch (error) {
      console.error(
        "GET questions:",
        error
      );

      return res
        .status(500)
        .json({
          ok: false,

          error:
            "تعذر تحميل الأسئلة",
        });
    }
  }
);

// ======================================================
// CHECK ANSWER
// ======================================================

app.post(
  "/api/check-answer",
  async (req, res) => {
    try {
      const {
        sessionId,
        questionId,
        answer,
        teamIndex,
      } = req.body;

      if (
        !sessionId ||
        !questionId ||
        typeof answer !==
          "string" ||
        !answer.trim() ||
        ![0, 1].includes(
          teamIndex
        )
      ) {
        return res
          .status(400)
          .json({
            ok: false,

            error:
              "بيانات الإجابة غير مكتملة",
          });
      }

      const session =
        getSession(
          sessionId
        );

      if (!session) {
        return res
          .status(404)
          .json({
            ok: false,

            error:
              "جلسة المباراة غير موجودة",
          });
      }

      if (
        !session
          .usedQuestionIds
          .has(
            questionId
          )
      ) {
        return res
          .status(400)
          .json({
            ok: false,

            error:
              "هذا السؤال ليس ضمن المباراة الحالية",
          });
      }

      const questionAnswers =
        await getAnswersForQuestion(
          questionId
        );

      if (
        questionAnswers.length ===
        0
      ) {
        return res
          .status(404)
          .json({
            ok: false,

            error:
              "إجابات السؤال غير موجودة",
          });
      }

      // ==================================================
      // SMART MATCHER V5
      // ==================================================

      const found =
        findSmartAnswer(
          answer,
          questionAnswers
        );

      // ==================================================
      // WRONG
      // ==================================================

      if (!found) {
        return res.json({
          ok: true,

          correct:
            false,

          duplicate:
            false,

          scores:
            session.scores,

          bonusWins:
            session.bonusWins,
        });
      }

      // ==================================================
      // REVEALED
      // ==================================================

      if (
        !session
          .revealedByQuestion
          .has(
            questionId
          )
      ) {
        session
          .revealedByQuestion
          .set(
            questionId,
            new Set()
          );
      }

      const revealedRanks =
        session
          .revealedByQuestion
          .get(
            questionId
          );

      // ==================================================
      // DUPLICATE
      // ==================================================

      if (
        revealedRanks.has(
          found.rank
        )
      ) {
        return res.json({
          ok: true,

          correct:
            true,

          duplicate:
            true,

          rank:
            found.rank,

          answer:
            found.answer,

          description:
            found.description ||
            "",

          points:
            0,

          matchMethod:
            found.matchMethod,

          matchScore:
            found.matchScore,

          matchedText:
            found.matchedText,

          scores:
            session.scores,

          bonusWins:
            session.bonusWins,
        });
      }

      // ==================================================
      // CORRECT
      // ==================================================

      revealedRanks.add(
        found.rank
      );

      session.scores[
        teamIndex
      ].total +=
        found.rank;

      session.scores[
        teamIndex
      ].category +=
        found.rank;

      return res.json({
        ok: true,

        correct:
          true,

        duplicate:
          false,

        rank:
          found.rank,

        answer:
          found.answer,

        description:
          found.description ||
          "",

        points:
          found.rank,

        matchMethod:
          found.matchMethod,

        matchScore:
          found.matchScore,

        matchedText:
          found.matchedText,

        scores:
          session.scores,

        bonusWins:
          session.bonusWins,
      });
    } catch (error) {
      console.error(
        "POST /api/check-answer:",
        error
      );

      return res
        .status(500)
        .json({
          ok: false,

          error:
            "تعذر التحقق من الإجابة",
        });
    }
  }
);

// ======================================================
// FINISH CATEGORY
// ======================================================

app.post(
  "/api/finish-category",
  (req, res) => {
    const {
      sessionId,
      categoryId,
    } = req.body;

    const session =
      getSession(
        sessionId
      );

    if (!session) {
      return res
        .status(404)
        .json({
          ok: false,

          error:
            "جلسة المباراة غير موجودة",
        });
    }

    if (
      !session
        .categories
        .includes(
          categoryId
        ) ||
      session
        .completedCategories
        .includes(
          categoryId
        )
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          error:
            "الفئة غير صالحة أو تم إنهاؤها مسبقًا",
        });
    }

    const teamCategoryScores =
      [
        session
          .scores[0]
          .category,

        session
          .scores[1]
          .category,
      ];

    let winner =
      null;

    if (
      teamCategoryScores[0] >
      teamCategoryScores[1]
    ) {
      winner = 0;
    } else if (
      teamCategoryScores[1] >
      teamCategoryScores[0]
    ) {
      winner = 1;
    }

    if (
      winner !== null
    ) {
      session.scores[
        winner
      ].total +=
        10;

      session.bonusWins[
        winner
      ] +=
        1;
    }

    session
      .completedCategories
      .push(
        categoryId
      );

    const categoryResult = {
      categoryId,

      teamCategoryScores,

      winner,

      isLastCategory:
        session
          .completedCategories
          .length ===
        3,
    };

    session.scores =
      session.scores.map(
        (team) => ({
          total:
            team.total,

          category:
            0,
        })
      );

    return res.json({
      ok: true,

      categoryResult,

      scores:
        session.scores,

      bonusWins:
        session.bonusWins,

      completedCategories:
        session
          .completedCategories,
    });
  }
);

// ======================================================
// END SESSION
// ======================================================

app.post(
  "/api/end-session",
  (req, res) => {
    const {
      sessionId,
    } = req.body;

    if (sessionId) {
      gameSessions.delete(
        sessionId
      );
    }

    return res.json({
      ok: true,
    });
  }
);

// ======================================================
// START SERVER
// ======================================================

app.listen(
  PORT,
  () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );

    console.log(
      "Supabase connected ✅"
    );

    console.log(
      "Smart Arabic Matcher V5 connected ✅"
    );

    console.log(
      "Answer descriptions enabled ✅"
    );

    console.log(
      "Locked categories enabled 🔒"
    );
  }
);