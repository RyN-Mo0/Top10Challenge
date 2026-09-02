require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");
const { findSmartAnswer } = require("./arabicMatcher");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error(
    "❌ Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env"
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

// ========================================
// ALIASES
// ========================================

function splitAliases(aliases) {
  // إذا كانت أصلًا Array
  if (Array.isArray(aliases)) {
    return aliases
      .map((alias) => String(alias || "").trim())
      .filter(Boolean);
  }

  // إذا كانت نص من Supabase:
  // Google|قوقل|غوغل
  return String(aliases || "")
    .split("|")
    .map((alias) => alias.trim())
    .filter(Boolean);
}

// ========================================
// QUESTIONS
// ========================================

async function getQuestions() {
  const { data, error } = await supabase
    .from("questions")
    .select("id, title, category_id")
    .order("category_id")
    .order("id");

  if (error) {
    throw new Error(
      `Failed to load questions: ${error.message}`
    );
  }

  return data || [];
}

// ========================================
// ANSWERS
// ========================================

async function getAnswers(questionId) {
  const { data, error } = await supabase
    .from("answers")
    .select(
      "id, question_id, rank, answer, aliases, description"
    )
    .eq("question_id", questionId)
    .order("rank");

  if (error) {
    throw new Error(
      `Failed to load answers for ${questionId}: ${error.message}`
    );
  }

  // ⭐ المهم:
  // نفس التحويل الموجود في server.js
  return (data || []).map((item) => ({
    id: item.id,

    questionId: item.question_id,

    rank: Number(item.rank),

    answer: item.answer,

    aliases: splitAliases(item.aliases),

    description: item.description,
  }));
}

// ========================================
// RUN ONE TEST
// ========================================

function runCase(
  input,
  expectedAnswer,
  questionAnswers
) {
  const result = findSmartAnswer(
    input,
    questionAnswers
  );

  const passed =
    result &&
    result.answer &&
    result.answer.trim() ===
      expectedAnswer.trim();

  return {
    passed,

    input,

    expectedAnswer,

    receivedAnswer:
      result?.answer || null,

    method:
      result?.matchMethod || null,

    score:
      result?.matchScore ?? null,

    matchedText:
      result?.matchedText || null,
  };
}

// ========================================
// MAIN
// ========================================

async function main() {
  console.log(
    "\n🗄️  REAL DATABASE MATCHER TEST"
  );

  console.log(
    "========================================\n"
  );

  const questions =
    await getQuestions();

  if (!questions.length) {
    console.log(
      "❌ No questions found in Supabase."
    );

    return;
  }

  let totalQuestions = 0;

  let totalAnswers = 0;

  let totalTests = 0;

  let passedTests = 0;

  let failedTests = 0;

  const failures = [];

  // ========================================
  // QUESTIONS LOOP
  // ========================================

  for (const question of questions) {
    const questionAnswers =
      await getAnswers(question.id);

    if (!questionAnswers.length) {
      console.log(
        `⚠️  No answers: ${question.title}`
      );

      continue;
    }

    totalQuestions++;

    totalAnswers +=
      questionAnswers.length;

    console.log(
      `\n📌 ${question.title}`
    );

    console.log(
      `   ${questionAnswers.length} answers`
    );

    // ========================================
    // ANSWERS LOOP
    // ========================================

    for (const item of questionAnswers) {
      const inputsToTest = [
        {
          type: "answer",
          value: item.answer,
        },

        ...item.aliases.map(
          (alias) => ({
            type: "alias",
            value: alias,
          })
        ),
      ];

      // ========================================
      // INPUT TEST LOOP
      // ========================================

      for (
        const testInput of
        inputsToTest
      ) {
        totalTests++;

        const result =
          runCase(
            testInput.value,
            item.answer,
            questionAnswers
          );

        if (result.passed) {
          passedTests++;

          console.log(
            `   ✅ [${testInput.type}] "${testInput.value}" → ${item.answer}`
          );
        } else {
          failedTests++;

          console.log(
            `   ❌ [${testInput.type}] "${testInput.value}" → expected "${item.answer}", got "${result.receivedAnswer || "NO MATCH"}"`
          );

          failures.push({
            question:
              question.title,

            rank:
              item.rank,

            type:
              testInput.type,

            input:
              testInput.value,

            expected:
              item.answer,

            received:
              result.receivedAnswer,

            method:
              result.method,

            score:
              result.score,

            matchedText:
              result.matchedText,
          });
        }
      }
    }
  }

  // ========================================
  // REPORT
  // ========================================

  console.log(
    "\n\n========================================"
  );

  console.log(
    "📊 FINAL DATABASE REPORT"
  );

  console.log(
    "========================================"
  );

  console.log(
    `📚 Questions: ${totalQuestions}`
  );

  console.log(
    `💡 Answers: ${totalAnswers}`
  );

  console.log(
    `🧪 Total tests: ${totalTests}`
  );

  console.log(
    `✅ Passed: ${passedTests}`
  );

  console.log(
    `❌ Failed: ${failedTests}`
  );

  const accuracy =
    totalTests === 0
      ? 0
      : (
          (passedTests /
            totalTests) *
          100
        );

  console.log(
    `📊 Accuracy: ${accuracy.toFixed(
      1
    )}%`
  );

  // ========================================
  // FAILURES
  // ========================================

  if (failures.length) {
    console.log(
      "\n❌ FAILURES"
    );

    console.log(
      "========================================"
    );

    failures.forEach(
      (failure, index) => {
        console.log(
          `\n${index + 1}. ${failure.question}`
        );

        console.log(
          `   Rank: ${failure.rank}`
        );

        console.log(
          `   Type: ${failure.type}`
        );

        console.log(
          `   Input: "${failure.input}"`
        );

        console.log(
          `   Expected: "${failure.expected}"`
        );

        console.log(
          `   Received: "${
            failure.received ||
            "NO MATCH"
          }"`
        );

        console.log(
          `   Method: ${
            failure.method || "-"
          }`
        );

        console.log(
          `   Score: ${
            failure.score !== null
              ? Number(
                  failure.score
                ).toFixed(3)
              : "-"
          }`
        );

        console.log(
          `   Matched text: "${
            failure.matchedText ||
            "-"
          }"`
        );
      }
    );
  } else {
    console.log(
      "\n🎉 PERFECT!"
    );

    console.log(
      "Every canonical answer and alias in Supabase matched correctly."
    );
  }

  console.log(
    "\n========================================\n"
  );
}

// ========================================
// START
// ========================================

main().catch((error) => {
  console.error(
    "\n💥 TEST CRASHED"
  );

  console.error(error);

  process.exit(1);
});