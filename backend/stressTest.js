require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");
const { findSmartAnswer } = require("./arabicMatcher");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// ========================================
// BASICS
// ========================================

function splitAliases(aliases) {
  if (Array.isArray(aliases)) {
    return aliases
      .map((x) => String(x || "").trim())
      .filter(Boolean);
  }

  return String(aliases || "")
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean);
}

function containsArabic(value = "") {
  return /[\u0600-\u06FF]/.test(String(value));
}

function unique(values) {
  return [...new Set(
    values
      .map((x) => String(x || "").trim())
      .filter(Boolean)
  )];
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function pick(arr) {
  if (!arr.length) return null;
  return arr[randomInt(arr.length)];
}

function shuffle(arr) {
  return [...arr].sort(
    () => Math.random() - 0.5
  );
}

function percent(a, b) {
  if (!b) return "0.0";
  return ((a / b) * 100).toFixed(1);
}

// ========================================
// NORMALIZATION FOR TEST LOGIC ONLY
// ========================================

function testNormalize(value = "") {
  return String(value)
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(
      /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g,
      ""
    )
    .replace(/\u0640/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ");
}

function isSameNormalized(a, b) {
  return testNormalize(a) ===
    testNormalize(b);
}

// ========================================
// LOAD DATABASE
// ========================================

async function getQuestions() {
  const { data, error } = await supabase
    .from("questions")
    .select("id, title, category_id")
    .order("category_id")
    .order("id");

  if (error) throw error;

  return data || [];
}

async function getAnswers(questionId) {
  const { data, error } = await supabase
    .from("answers")
    .select(
      "question_id, rank, answer, aliases"
    )
    .eq("question_id", questionId)
    .order("rank");

  if (error) throw error;

  return (data || []).map((item) => ({
    questionId: item.question_id,
    rank: Number(item.rank),
    answer: item.answer,
    aliases: splitAliases(item.aliases),
  }));
}

// ========================================
// KNOWN VALID FORMS
// ========================================

function getValidForms(item) {
  return unique([
    item.answer,
    ...item.aliases,
  ]);
}

function buildAllValidForms(answers) {
  const result = [];

  for (const item of answers) {
    for (const form of getValidForms(item)) {
      result.push({
        rank: item.rank,
        answer: item.answer,
        value: form,
      });
    }
  }

  return result;
}

// ========================================
// REALISTIC POSITIVE MUTATIONS
// ========================================

function duplicateChar(text) {
  const chars = [...text];

  const possible = chars
    .map((char, index) => ({
      char,
      index,
    }))
    .filter(
      ({ char }) =>
        /[\u0621-\u064A]/.test(char)
    );

  if (!possible.length) return null;

  const selected = pick(possible);

  chars.splice(
    selected.index,
    0,
    selected.char
  );

  return chars.join("");
}

function swapAdjacent(text) {
  const chars = [...text];

  const possible = [];

  for (
    let i = 0;
    i < chars.length - 1;
    i++
  ) {
    if (
      /[\u0621-\u064A]/.test(chars[i]) &&
      /[\u0621-\u064A]/.test(chars[i + 1]) &&
      chars[i] !== chars[i + 1]
    ) {
      possible.push(i);
    }
  }

  if (!possible.length) {
    return null;
  }

  const index = pick(possible);

  [
    chars[index],
    chars[index + 1],
  ] = [
    chars[index + 1],
    chars[index],
  ];

  return chars.join("");
}

function hamzaVariant(text) {
  if (!/[أإآ]/.test(text)) {
    return null;
  }

  return text.replace(
    /[أإآ]/g,
    "ا"
  );
}

function yaaVariant(text) {
  if (!text.includes("ى")) {
    return null;
  }

  return text.replace(
    /ى/g,
    "ي"
  );
}

function taMarbutaVariant(text) {
  if (!text.includes("ة")) {
    return null;
  }

  return text.replace(
    /ة/g,
    "ه"
  );
}

function extraSpaces(text) {
  if (!text.includes(" ")) {
    return null;
  }

  return text.replace(
    / /g,
    "  "
  );
}

function compactSpaces(text) {
  if (!text.includes(" ")) {
    return null;
  }

  return text.replace(
    /\s+/g,
    ""
  );
}

function addArticle(text) {
  const words =
    text.split(/\s+/);

  if (!words.length) {
    return null;
  }

  if (
    words[0].startsWith("ال") ||
    words[0].length < 4
  ) {
    return null;
  }

  words[0] =
    `ال${words[0]}`;

  return words.join(" ");
}

function removeArticle(text) {
  const words =
    text.split(/\s+/);

  let changed = false;

  const result =
    words.map((word) => {
      if (
        word.startsWith("ال") &&
        word.length > 5
      ) {
        changed = true;
        return word.slice(2);
      }

      return word;
    });

  if (!changed) {
    return null;
  }

  return result.join(" ");
}

// حذف حرف واحد، لكن فقط من كلمة طويلة
function safeDeleteChar(text) {
  const chars = [...text];

  const arabicIndexes =
    chars
      .map((char, index) => ({
        char,
        index,
      }))
      .filter(
        ({ char }) =>
          /[\u0621-\u064A]/.test(char)
      );

  if (arabicIndexes.length < 7) {
    return null;
  }

  // نتجنب أول وآخر حرف
  const possible =
    arabicIndexes.filter(
      ({ index }) =>
        index > 0 &&
        index < chars.length - 1
    );

  if (!possible.length) {
    return null;
  }

  const selected = pick(possible);

  chars.splice(
    selected.index,
    1
  );

  return chars.join("");
}

// استبدال حرف قريب
function safeSubstitution(text) {
  const map = {
    س: ["ص"],
    ص: ["س"],
    ت: ["ط"],
    ط: ["ت"],
    د: ["ذ"],
    ذ: ["د"],
    ز: ["ر"],
    ر: ["ز"],
    ف: ["ق"],
    ق: ["ف"],
    ج: ["ح"],
    ح: ["ج"],
    غ: ["ع"],
    ع: ["غ"],
  };

  const chars = [...text];

  const possible =
    chars
      .map((char, index) => ({
        char,
        index,
        choices: map[char],
      }))
      .filter(
        (x) =>
          x.choices?.length
      );

  if (!possible.length) {
    return null;
  }

  const selected = pick(possible);

  chars[selected.index] =
    pick(selected.choices);

  return chars.join("");
}

// ========================================
// POSITIVE CASES
// ========================================

function generatePositiveCases(item) {
  const cases = [];

  const forms =
    getValidForms(item)
      .filter(containsArabic);

  for (const form of forms) {
    const mutations = [
      {
        type: "duplicate-char",
        value: duplicateChar(form),
      },
      {
        type: "swap-adjacent",
        value: swapAdjacent(form),
      },
      {
        type: "hamza",
        value: hamzaVariant(form),
      },
      {
        type: "yaa",
        value: yaaVariant(form),
      },
      {
        type: "ta-marbuta",
        value: taMarbutaVariant(form),
      },
      {
        type: "extra-spaces",
        value: extraSpaces(form),
      },
      {
        type: "compact-spaces",
        value: compactSpaces(form),
      },
      {
        type: "add-article",
        value: addArticle(form),
      },
      {
        type: "remove-article",
        value: removeArticle(form),
      },
      {
        type: "delete-char",
        value: safeDeleteChar(form),
      },
      {
        type: "substitution",
        value: safeSubstitution(form),
      },
    ];

    for (const mutation of mutations) {
      if (
        !mutation.value ||
        mutation.value === form
      ) {
        continue;
      }

      cases.push({
        expectedRank:
          item.rank,

        expectedAnswer:
          item.answer,

        original:
          form,

        input:
          mutation.value,

        type:
          mutation.type,
      });
    }
  }

  return cases;
}

// ========================================
// NEGATIVE CASES
// ========================================

function generateNegativeCases(
  currentItem,
  answers
) {
  const result = [];

  const allValidForms =
    buildAllValidForms(answers);

  // أهم اختبار سلبي:
  // أي إجابة أخرى في نفس السؤال
  // يجب ألا ترجع currentItem
  for (const other of allValidForms) {
    if (
      other.rank ===
      currentItem.rank
    ) {
      continue;
    }

    result.push({
      input:
        other.value,

      forbiddenRank:
        currentItem.rank,

      source:
        "other-valid-answer",
    });
  }

  return result;
}

// ========================================
// VALIDATE GENERATED CASE
// ========================================

function positiveCaseIsSafe(
  testCase,
  answers
) {
  const allValid =
    buildAllValidForms(answers);

  // لو الـmutation أصبح حرفيًا
  // إجابة صحيحة لرتبة أخرى،
  // ما نعتبره positive.
  for (const valid of allValid) {
    if (
      valid.rank !==
        testCase.expectedRank &&
      isSameNormalized(
        valid.value,
        testCase.input
      )
    ) {
      return false;
    }
  }

  return true;
}

// ========================================
// MAIN
// ========================================

async function main() {
  console.log(
    "\n🔥 STRESS TEST V2"
  );

  console.log(
    "========================================\n"
  );

  const questions =
    await getQuestions();

  let positiveTotal = 0;
  let positivePassed = 0;

  let negativeTotal = 0;
  let negativePassed = 0;

  const falseNegatives = [];
  const falsePositives = [];

  const positiveByType = {};

  for (const question of questions) {
    const answers =
      await getAnswers(
        question.id
      );

    console.log(
      `📌 ${question.title}`
    );

    // ========================================
    // POSITIVES
    // ========================================

    for (const item of answers) {
      const generated =
        generatePositiveCases(item)
          .filter((testCase) =>
            positiveCaseIsSafe(
              testCase,
              answers
            )
          );

      // حتى يظل الحجم معقولًا
      const selected =
        shuffle(generated)
          .slice(0, 12);

      for (const testCase of selected) {
        positiveTotal++;

        if (
          !positiveByType[
            testCase.type
          ]
        ) {
          positiveByType[
            testCase.type
          ] = {
            total: 0,
            passed: 0,
          };
        }

        positiveByType[
          testCase.type
        ].total++;

        const found =
          findSmartAnswer(
            testCase.input,
            answers
          );

        const passed =
          found &&
          found.rank ===
            testCase.expectedRank;

        if (passed) {
          positivePassed++;

          positiveByType[
            testCase.type
          ].passed++;
        } else {
          falseNegatives.push({
            question:
              question.title,

            expected:
              testCase.expectedAnswer,

            original:
              testCase.original,

            input:
              testCase.input,

            mutation:
              testCase.type,

            received:
              found?.answer ||
              "NO MATCH",

            method:
              found?.matchMethod ||
              "-",

            score:
              found?.matchScore ??
              null,
          });
        }
      }
    }

    // ========================================
    // NEGATIVES
    // ========================================

    for (const item of answers) {
      const generated =
        generateNegativeCases(
          item,
          answers
        );

      const selected =
        shuffle(generated)
          .slice(0, 20);

      for (const testCase of selected) {
        negativeTotal++;

        const found =
          findSmartAnswer(
            testCase.input,
            answers
          );

        // مهم:
        // لو رجع الرتبة الأصلية للكلمة
        // فهذا طبيعي.
        // نحن فقط نتحقق أنه لم يرجع
        // currentItem الخطأ.
        const passed =
          !found ||
          found.rank !==
            testCase.forbiddenRank;

        if (passed) {
          negativePassed++;
        } else {
          falsePositives.push({
            question:
              question.title,

            shouldNotMatch:
              item.answer,

            forbiddenRank:
              item.rank,

            input:
              testCase.input,

            source:
              testCase.source,

            received:
              found.answer,

            receivedRank:
              found.rank,

            method:
              found.matchMethod,

            score:
              found.matchScore,
          });
        }
      }
    }

    console.log(
      "   ✅ done"
    );
  }

  // ========================================
  // SUMMARY
  // ========================================

  const total =
    positiveTotal +
    negativeTotal;

  const passed =
    positivePassed +
    negativePassed;

  console.log(
    "\n========================================"
  );

  console.log(
    "📊 STRESS TEST V2 REPORT"
  );

  console.log(
    "========================================"
  );

  console.log(
    `🧪 Total tests: ${total}`
  );

  console.log("");

  console.log(
    `🟢 Positive tests: ${positiveTotal}`
  );

  console.log(
    `✅ Passed: ${positivePassed}`
  );

  console.log(
    `❌ False negatives: ${
      falseNegatives.length
    }`
  );

  console.log(
    `📊 Positive accuracy: ${percent(
      positivePassed,
      positiveTotal
    )}%`
  );

  console.log("");

  console.log(
    `🔴 Negative tests: ${negativeTotal}`
  );

  console.log(
    `✅ Passed: ${negativePassed}`
  );

  console.log(
    `❌ False positives: ${
      falsePositives.length
    }`
  );

  console.log(
    `📊 Negative accuracy: ${percent(
      negativePassed,
      negativeTotal
    )}%`
  );

  console.log("");

  console.log(
    `🏆 Overall: ${passed}/${total}`
  );

  console.log(
    `📊 Overall accuracy: ${percent(
      passed,
      total
    )}%`
  );

  // ========================================
  // MUTATION BREAKDOWN
  // ========================================

  console.log(
    "\n🧬 POSITIVE MUTATIONS"
  );

  console.log(
    "========================================"
  );

  Object.entries(
    positiveByType
  ).forEach(
    ([type, stats]) => {
      console.log(
        `${type}: ${stats.passed}/${stats.total} (${percent(
          stats.passed,
          stats.total
        )}%)`
      );
    }
  );

  // ========================================
  // FALSE NEGATIVES
  // ========================================

  if (falseNegatives.length) {
    console.log(
      "\n⚠️ FALSE NEGATIVES"
    );

    console.log(
      "========================================"
    );

    falseNegatives
      .slice(0, 40)
      .forEach(
        (item, index) => {
          console.log(
            `\n${index + 1}. ${item.question}`
          );

          console.log(
            `   Expected: ${item.expected}`
          );

          console.log(
            `   Original: "${item.original}"`
          );

          console.log(
            `   Input: "${item.input}"`
          );

          console.log(
            `   Mutation: ${item.mutation}`
          );

          console.log(
            `   Received: ${item.received}`
          );

          console.log(
            `   Method: ${item.method}`
          );

          console.log(
            `   Score: ${
              item.score === null
                ? "-"
                : Number(
                    item.score
                  ).toFixed(3)
            }`
          );
        }
      );
  }

  // ========================================
  // TRUE FALSE POSITIVES
  // ========================================

  if (falsePositives.length) {
    console.log(
      "\n🚨 TRUE FALSE POSITIVES"
    );

    console.log(
      "========================================"
    );

    falsePositives
      .slice(0, 40)
      .forEach(
        (item, index) => {
          console.log(
            `\n${index + 1}. ${item.question}`
          );

          console.log(
            `   Should NOT match: ${item.shouldNotMatch}`
          );

          console.log(
            `   Input: "${item.input}"`
          );

          console.log(
            `   Received: ${item.received}`
          );

          console.log(
            `   Method: ${item.method}`
          );

          console.log(
            `   Score: ${
              item.score === null
                ? "-"
                : Number(
                    item.score
                  ).toFixed(3)
            }`
          );
        }
      );
  } else {
    console.log(
      "\n🛡️ No true false positives detected."
    );
  }

  console.log(
    "\n========================================\n"
  );
}

main().catch((error) => {
  console.error(
    "\n💥 STRESS TEST V2 CRASHED"
  );

  console.error(error);

  process.exit(1);
});