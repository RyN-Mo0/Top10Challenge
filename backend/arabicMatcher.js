// ======================================================
// TOP 10 CHALLENGE
// SMART ARABIC ANSWER MATCHER - V5
// ======================================================

const ARABIC_DIACRITICS =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;

const OPTIONAL_WORDS = new Set([
  "شركه",
  "نادي",
  "منتخب",
  "فريق",
  "مدينه",
  "دوله",
  "مسلسل",
  "فيلم",
  "لعبه",
  "تطبيق",
  "برنامج",
  "نظام",
  "لغه",
  "منصه",
  "بطوله",
  "ماركه",
  "علامه",
  "عاصمه",

  "اجابه",
  "جواب",
  "اسم",
]);

// ======================================================
// BASIC
// ======================================================

function containsArabic(value = "") {
  return /[\u0600-\u06FF]/.test(
    String(value)
  );
}

function normalizeArabicDigits(value = "") {
  const arabicIndic =
    "٠١٢٣٤٥٦٧٨٩";

  const easternArabicIndic =
    "۰۱۲۳۴۵۶۷۸۹";

  return String(value)
    .replace(
      /[٠-٩]/g,
      (digit) =>
        String(
          arabicIndic.indexOf(digit)
        )
    )
    .replace(
      /[۰-۹]/g,
      (digit) =>
        String(
          easternArabicIndic.indexOf(
            digit
          )
        )
    );
}

// ======================================================
// NORMALIZE ARABIC
// ======================================================

function normalizeArabic(value = "") {
  return normalizeArabicDigits(value)
    .normalize("NFKC")
    .trim()
    .toLowerCase()

    // التشكيل
    .replace(
      ARABIC_DIACRITICS,
      ""
    )

    // التطويل
    .replace(/\u0640/g, "")

    // أنواع الألف
    .replace(/[أإآٱ]/g, "ا")

    // الألف المقصورة
    .replace(/ى/g, "ي")

    // الهمزات
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")

    // التاء المربوطة
    .replace(/ة/g, "ه")

    // حروف بديلة
    .replace(/گ/g, "ك")
    .replace(/ک/g, "ك")
    .replace(/ی/g, "ي")
    .replace(/چ/g, "ج")
    .replace(/پ/g, "ب")
    .replace(/ڤ/g, "ف")

    // كوووووره -> كوره
    .replace(
      /([\u0621-\u064A])\1{2,}/g,
      "$1"
    )

    // إزالة الرموز
    .replace(
      /[^\u0621-\u063A\u0641-\u064A0-9\s]/g,
      " "
    )

    .replace(/\s+/g, " ")
    .trim();
}

function normalizeBasic(value = "") {
  return normalizeArabicDigits(value)
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// ======================================================
// ال التعريف
// ======================================================

function removeArticleFromWord(word = "") {
  if (!word) {
    return "";
  }

  if (
    word.startsWith("وال") &&
    word.length > 5
  ) {
    return word.slice(3);
  }

  if (
    (
      word.startsWith("بال") ||
      word.startsWith("كال") ||
      word.startsWith("فال")
    ) &&
    word.length > 5
  ) {
    return word.slice(3);
  }

  if (
    word.startsWith("لل") &&
    word.length > 4
  ) {
    return word.slice(2);
  }

  if (
    word.startsWith("ال") &&
    word.length > 4
  ) {
    return word.slice(2);
  }

  return word;
}

function removeDefiniteArticles(value = "") {
  return normalizeArabic(value)
    .split(" ")
    .map(removeArticleFromWord)
    .filter(Boolean)
    .join(" ");
}

// ======================================================
// OPTIONAL WORDS
// ======================================================

function stripOptionalWords(value = "") {
  return normalizeArabic(value)
    .split(" ")
    .map(removeArticleFromWord)
    .filter(Boolean)
    .filter(
      (word) =>
        !OPTIONAL_WORDS.has(word)
    )
    .join(" ");
}

function compact(value = "") {
  return String(value)
    .replace(/\s+/g, "");
}

// ======================================================
// DAMERAU LEVENSHTEIN
// ======================================================

function damerauLevenshtein(
  a = "",
  b = ""
) {
  const first = String(a);
  const second = String(b);

  if (first === second) {
    return 0;
  }

  if (!first.length) {
    return second.length;
  }

  if (!second.length) {
    return first.length;
  }

  const rows =
    first.length + 1;

  const cols =
    second.length + 1;

  const matrix =
    Array.from(
      { length: rows },
      () =>
        Array(cols).fill(0)
    );

  for (
    let i = 0;
    i < rows;
    i++
  ) {
    matrix[i][0] = i;
  }

  for (
    let j = 0;
    j < cols;
    j++
  ) {
    matrix[0][j] = j;
  }

  for (
    let i = 1;
    i < rows;
    i++
  ) {
    for (
      let j = 1;
      j < cols;
      j++
    ) {
      const cost =
        first[i - 1] ===
        second[j - 1]
          ? 0
          : 1;

      matrix[i][j] =
        Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] +
            cost
        );

      // تبديل حرفين
      if (
        i > 1 &&
        j > 1 &&
        first[i - 1] ===
          second[j - 2] &&
        first[i - 2] ===
          second[j - 1]
      ) {
        matrix[i][j] =
          Math.min(
            matrix[i][j],
            matrix[i - 2][
              j - 2
            ] + 1
          );
      }
    }
  }

  return matrix[
    first.length
  ][second.length];
}

// ======================================================
// SIMILARITY
// ======================================================

function similarityScore(
  a = "",
  b = ""
) {
  const maxLength =
    Math.max(
      a.length,
      b.length
    );

  if (maxLength === 0) {
    return 1;
  }

  return (
    1 -
    damerauLevenshtein(a, b) /
      maxLength
  );
}

// ======================================================
// TOKEN SIMILARITY
// ======================================================

function tokenSimilarity(
  a = "",
  b = ""
) {
  const tokensA =
    new Set(
      a
        .split(" ")
        .filter(Boolean)
    );

  const tokensB =
    new Set(
      b
        .split(" ")
        .filter(Boolean)
    );

  if (
    tokensA.size === 0 ||
    tokensB.size === 0
  ) {
    return 0;
  }

  let matches = 0;

  for (
    const token of tokensA
  ) {
    if (
      tokensB.has(token)
    ) {
      matches++;
    }
  }

  return (
    matches /
    Math.max(
      tokensA.size,
      tokensB.size
    )
  );
}

// ======================================================
// WORD TYPO ANALYSIS
//
// مهم لـ:
// كرة القددم
// كرة القدم
// ======================================================

function compareWords(
  a = "",
  b = ""
) {
  const wordsA =
    a
      .split(" ")
      .filter(Boolean);

  const wordsB =
    b
      .split(" ")
      .filter(Boolean);

  if (
    wordsA.length !==
    wordsB.length ||
    wordsA.length === 0
  ) {
    return {
      valid: false,
      score: 0,
    };
  }

  let totalScore = 0;

  for (
    let i = 0;
    i < wordsA.length;
    i++
  ) {
    const wordA =
      wordsA[i];

    const wordB =
      wordsB[i];

    if (
      wordA === wordB
    ) {
      totalScore += 1;
      continue;
    }

    const distance =
      damerauLevenshtein(
        wordA,
        wordB
      );

    const similarity =
      similarityScore(
        wordA,
        wordB
      );

    /*
      كل كلمة مختلفة لازم تكون
      قريبة بشكل واضح.

      يسمح مثلًا:
      قددم -> قدم
    */
    if (
      distance > 1 ||
      similarity < 0.75
    ) {
      return {
        valid: false,
        score: 0,
      };
    }

    totalScore +=
      similarity;
  }

  return {
    valid: true,

    score:
      totalScore /
      wordsA.length,
  };
}

// ======================================================
// TYPO RULES
// ======================================================

function typoRules(length) {
  // كلمات قصيرة جدًا:
  // ممنوع fuzzy
  if (length <= 3) {
    return {
      maxDistance: 0,
      minSimilarity: 1,
    };
  }

  if (length <= 5) {
    return {
      maxDistance: 1,
      minSimilarity: 0.78,
    };
  }

  /*
    رجعناها 0.82 بدل 0.84.

    عشان:
    السعوية -> السعودية
  */
  if (length <= 8) {
    return {
      maxDistance: 1,
      minSimilarity: 0.82,
    };
  }

  if (length <= 12) {
    return {
      maxDistance: 2,
      minSimilarity: 0.84,
    };
  }

  if (length <= 18) {
    return {
      maxDistance: 3,
      minSimilarity: 0.85,
    };
  }

  return {
    maxDistance: 3,
    minSimilarity: 0.87,
  };
}

// ======================================================
// ة / ه PROTECTION
//
// الرياضة != الرياض
// طبيبة != طبيب
// حاسبة != حاسب
// ======================================================

function hasDifferentTaMarbutaEnding(
  user,
  target
) {
  const userEndsWithH =
    user.endsWith("ه");

  const targetEndsWithH =
    target.endsWith("ه");

  if (
    userEndsWithH ===
    targetEndsWithH
  ) {
    return false;
  }

  const userWithoutH =
    userEndsWithH
      ? user.slice(0, -1)
      : user;

  const targetWithoutH =
    targetEndsWithH
      ? target.slice(0, -1)
      : target;

  return (
    userWithoutH ===
    targetWithoutH
  );
}

// ======================================================
// ي النسب
//
// الرياضي != الرياض
// ======================================================

function hasNisbaYaaDifference(
  user,
  target
) {
  if (
    user.endsWith("ي") &&
    user.slice(0, -1) ===
      target
  ) {
    return true;
  }

  if (
    target.endsWith("ي") &&
    target.slice(0, -1) ===
      user
  ) {
    return true;
  }

  return false;
}

// ======================================================
// DUPLICATED FINAL LETTER
//
// يسمح:
//
// السعوديةه
// الحاسوبب
//
// لأنها غالبًا ضغطة مكررة.
// ======================================================

function isDuplicatedFinalLetter(
  user,
  target
) {
  const longer =
    user.length >
    target.length
      ? user
      : target;

  const shorter =
    user.length >
    target.length
      ? target
      : user;

  if (
    longer.length -
      shorter.length !==
    1
  ) {
    return false;
  }

  if (
    longer.slice(0, -1) !==
    shorter
  ) {
    return false;
  }

  if (
    longer.length < 2
  ) {
    return false;
  }

  return (
    longer[
      longer.length - 1
    ] ===
    longer[
      longer.length - 2
    ]
  );
}

// ======================================================
// FINAL CHARACTER DELETION
//
// الفرق هنا مهم:
//
// كوكاكول -> كوكاكولا ✅
// سامسون   -> سامسونج ❌
//
// إذا الحرف الناقص حرف نهاية شائع
// مثل ا / و / ي / ه، نسمح.
//
// أما حذف حرف قوي مثل ج في سامسونج
// فنرفضه.
// ======================================================

function isUnsafeFinalDeletion(
  user,
  target
) {
  if (
    Math.abs(
      user.length -
      target.length
    ) !== 1
  ) {
    return false;
  }

  const shorter =
    user.length <
    target.length
      ? user
      : target;

  const longer =
    user.length <
    target.length
      ? target
      : user;

  if (
    !longer.startsWith(
      shorter
    )
  ) {
    return false;
  }

  /*
    إذا هي مجرد ضغطة مكررة:
    الحاسوبب
    السعوديةه

    لا نرفض.
  */
  if (
    isDuplicatedFinalLetter(
      user,
      target
    )
  ) {
    return false;
  }

  const missingLetter =
    longer[
      longer.length - 1
    ];

  const weakFinalLetters =
    new Set([
      "ا",
      "و",
      "ي",
      "ه",
    ]);

  /*
    كوكاكول -> كوكاكولا
    مسموح
  */
  if (
    weakFinalLetters.has(
      missingLetter
    )
  ) {
    return false;
  }

  /*
    سامسون -> سامسونج
    مرفوض
  */
  return true;
}

// ======================================================
// COMPARE ARABIC
// ======================================================

function compareArabic(
  userInput,
  candidate
) {
  if (
    !containsArabic(userInput) ||
    !containsArabic(candidate)
  ) {
    return {
      matched: false,
      score: 0,
      method: "not-arabic",
    };
  }

  const user =
    normalizeArabic(
      userInput
    );

  const target =
    normalizeArabic(
      candidate
    );

  if (
    !user ||
    !target
  ) {
    return {
      matched: false,
      score: 0,
      method: "empty",
    };
  }

  // ==================================================
  // 1. NORMALIZED EXACT
  // ==================================================

  if (user === target) {
    return {
      matched: true,

      score: 1,

      method:
        "normalized-exact",

      distance: 0,
    };
  }

  // ==================================================
  // 2. ARTICLE
  // ==================================================

  const userNoArticle =
    removeDefiniteArticles(
      user
    );

  const targetNoArticle =
    removeDefiniteArticles(
      target
    );

  if (
    userNoArticle &&
    userNoArticle ===
      targetNoArticle
  ) {
    return {
      matched: true,

      score: 0.995,

      method:
        "article",

      distance: 0,
    };
  }

  // ==================================================
  // 3. OPTIONAL WORDS
  // ==================================================

  const cleanUser =
    stripOptionalWords(
      user
    );

  const cleanTarget =
    stripOptionalWords(
      target
    );

  if (
    cleanUser &&
    cleanTarget &&
    cleanUser ===
      cleanTarget
  ) {
    return {
      matched: true,

      score: 0.99,

      method:
        "optional-word",

      distance: 0,
    };
  }

  // ==================================================
  // 4. SPACING
  // ==================================================

  const compactUser =
    compact(
      cleanUser
    );

  const compactTarget =
    compact(
      cleanTarget
    );

  if (
    compactUser &&
    compactUser ===
      compactTarget
  ) {
    return {
      matched: true,

      score: 0.985,

      method:
        "spacing",

      distance: 0,
    };
  }

  if (
    !compactUser ||
    !compactTarget
  ) {
    return {
      matched: false,

      score: 0,

      method:
        "empty-after-cleaning",
    };
  }

  // ==================================================
  // 5. SEMANTIC PROTECTION
  // ==================================================

  // الرياضة != الرياض
  if (
    hasDifferentTaMarbutaEnding(
      compactUser,
      compactTarget
    )
  ) {
    return {
      matched: false,

      score: 0,

      method:
        "ta-marbuta-conflict",
    };
  }

  // الرياضي != الرياض
  if (
    hasNisbaYaaDifference(
      compactUser,
      compactTarget
    )
  ) {
    return {
      matched: false,

      score: 0,

      method:
        "nisba-yaa-conflict",
    };
  }

  // ==================================================
  // LENGTH
  // ==================================================

  const userLength =
    compactUser.length;

  const targetLength =
    compactTarget.length;

  const maxLength =
    Math.max(
      userLength,
      targetLength
    );

  const minLength =
    Math.min(
      userLength,
      targetLength
    );

  if (
    minLength <= 3
  ) {
    return {
      matched: false,

      score: 0,

      method:
        "too-short",
    };
  }

  const lengthDifference =
    Math.abs(
      userLength -
      targetLength
    );

  if (
    lengthDifference > 3
  ) {
    return {
      matched: false,

      score: 0,

      method:
        "length-difference",
    };
  }

  // ==================================================
  // CORE SCORES
  // ==================================================

  const distance =
    damerauLevenshtein(
      compactUser,
      compactTarget
    );

  const similarity =
    similarityScore(
      compactUser,
      compactTarget
    );

  const tokenScore =
    tokenSimilarity(
      cleanUser,
      cleanTarget
    );

  const {
    maxDistance,
    minSimilarity,
  } =
    typoRules(
      maxLength
    );

  const userWords =
    cleanUser
      .split(" ")
      .filter(Boolean);

  const targetWords =
    cleanTarget
      .split(" ")
      .filter(Boolean);

  const multiWord =
    userWords.length > 1 ||
    targetWords.length > 1;

  // ==================================================
  // 6. MULTI WORD
  // ==================================================

  if (multiWord) {
    if (
      userWords.length ===
      targetWords.length
    ) {
      const wordResult =
        compareWords(
          cleanUser,
          cleanTarget
        );

      /*
        كرة القددم
        كرة القدم
      */
      if (
        wordResult.valid &&
        wordResult.score >=
          0.85
      ) {
        return {
          matched: true,

          score:
            0.82 +
            wordResult.score *
              0.14,

          method:
            "word-typo",

          distance,

          similarity,

          wordScore:
            wordResult.score,
        };
      }
    }

    if (
      Math.abs(
        userWords.length -
        targetWords.length
      ) > 1
    ) {
      return {
        matched: false,

        score:
          similarity,

        method:
          "word-count-difference",

        distance,
      };
    }

    /*
      كرة السلة
      كرة القدم

      كلمة مشتركة لكن إجابتان مختلفتان.
    */
    if (
      tokenScore > 0 &&
      tokenScore < 1 &&
      similarity < 0.88
    ) {
      return {
        matched: false,

        score:
          similarity,

        method:
          "partial-token-conflict",

        distance,
      };
    }

    if (
      tokenScore === 0 &&
      similarity < 0.90
    ) {
      return {
        matched: false,

        score:
          similarity,

        method:
          "weak-token-overlap",

        distance,
      };
    }
  }

  // ==================================================
  // 7. DUPLICATED FINAL KEY
  //
  // الحاسوبب
  // السعوديةه
  // ==================================================

  if (
    !multiWord &&
    isDuplicatedFinalLetter(
      compactUser,
      compactTarget
    )
  ) {
    return {
      matched: true,

      score: 0.94,

      method:
        "duplicated-final-letter",

      distance: 1,

      similarity,
    };
  }

  // ==================================================
  // 8. UNSAFE FINAL DELETION
  //
  // سامسون -> سامسونج
  // ==================================================

  if (
    !multiWord &&
    isUnsafeFinalDeletion(
      compactUser,
      compactTarget
    )
  ) {
    return {
      matched: false,

      score:
        similarity,

      method:
        "unsafe-final-deletion",

      distance,
    };
  }

  // ==================================================
  // 9. NORMAL TYPO
  //
  // هنا سامسونق -> سامسونج ينجح.
  //
  // لأن هذا استبدال حرف وليس حذف حرف.
  // ==================================================

  if (
    distance <= maxDistance &&
    similarity >=
      minSimilarity
  ) {
    const fuzzyScore =
      0.80 +
      similarity *
        0.15;

    return {
      matched: true,

      score:
        fuzzyScore,

      method:
        "typo",

      distance,

      similarity,

      tokenScore,
    };
  }

  return {
    matched: false,

    score:
      similarity,

    method:
      "none",

    distance,

    similarity,

    tokenScore,
  };
}

// ======================================================
// CANDIDATES
// ======================================================

function getAnswerCandidates(item) {
  return [
    item.answer,

    ...(item.aliases || []),
  ]
    .map((value) =>
      String(
        value || ""
      ).trim()
    )
    .filter(Boolean);
}

// ======================================================
// FIND SMART ANSWER
// ======================================================

function findSmartAnswer(
  userInput,
  answers
) {
  const input =
    String(
      userInput || ""
    ).trim();

  if (!input) {
    return null;
  }

  // ==================================================
  // 1. EXACT
  // ==================================================

  const basicInput =
    normalizeBasic(
      input
    );

  for (
    const item of answers
  ) {
    for (
      const candidate
      of getAnswerCandidates(
        item
      )
    ) {
      if (
        normalizeBasic(
          candidate
        ) ===
        basicInput
      ) {
        return {
          ...item,

          matchedText:
            candidate,

          matchMethod:
            "exact",

          matchScore:
            1,
        };
      }
    }
  }

  // fuzzy عربي فقط
  if (
    !containsArabic(
      input
    )
  ) {
    return null;
  }

  // ==================================================
  // 2. SMART ARABIC
  // ==================================================

  const bestByRank =
    new Map();

  for (
    const item of answers
  ) {
    const candidates =
      getAnswerCandidates(
        item
      );

    for (
      const candidate
      of candidates
    ) {
      if (
        !containsArabic(
          candidate
        )
      ) {
        continue;
      }

      const result =
        compareArabic(
          input,
          candidate
        );

      if (
        !result.matched
      ) {
        continue;
      }

      const previous =
        bestByRank.get(
          item.rank
        );

      if (
        !previous ||
        result.score >
          previous.matchScore
      ) {
        bestByRank.set(
          item.rank,
          {
            ...item,

            matchedText:
              candidate,

            matchMethod:
              result.method,

            matchScore:
              result.score,

            matchDistance:
              result.distance,

            matchSimilarity:
              result.similarity,
          }
        );
      }
    }
  }

  const matches =
    [
      ...bestByRank.values(),
    ].sort(
      (a, b) =>
        b.matchScore -
        a.matchScore
    );

  if (
    matches.length === 0
  ) {
    return null;
  }

  const best =
    matches[0];

  const second =
    matches[1];

  // ==================================================
  // AMBIGUITY PROTECTION
  // ==================================================

  if (
    second &&
    (
      best.matchMethod ===
        "typo" ||
      best.matchMethod ===
        "word-typo"
    ) &&
    (
      second.matchMethod ===
        "typo" ||
      second.matchMethod ===
        "word-typo"
    )
  ) {
    const difference =
      best.matchScore -
      second.matchScore;

    if (
      difference <
      0.045
    ) {
      return null;
    }
  }

  return best;
}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  containsArabic,
  normalizeArabic,
  normalizeBasic,
  removeDefiniteArticles,
  stripOptionalWords,
  damerauLevenshtein,
  similarityScore,
  tokenSimilarity,
  compareWords,
  compareArabic,
  findSmartAnswer,
};