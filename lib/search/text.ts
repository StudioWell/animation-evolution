/**
 * Text normalisation for search: lowercase, strip accents/punctuation,
 * light stemming and a small animation-specific synonym map.
 */

const STOPWORDS = new Set([
  "a", "an", "and", "the", "of", "to", "in", "on", "for", "with", "how", "do", "does", "is", "are",
  "my", "your", "at", "by", "from", "into", "vs", "or", "it", "its", "this", "that", "what", "when",
  "which", "one", "use", "using", "make", "made", "animation", "animations", "animate", "animating",
  "reference", "references", "tutorial", "tutorials", "video", "videos", "guide",
  // Too generic in this domain to rank on.
  "character", "characters", "around",
]);

// Groups of interchangeable terms (already stemmed form on the right side is fine).
const SYNONYM_GROUPS: string[][] = [
  ["punch", "strike", "jab", "hook", "uppercut", "fist"],
  ["kick", "roundhouse"],
  ["walk", "gait", "stride", "stroll"],
  ["run", "jog", "sprint"],
  ["jump", "leap", "hop"],
  ["fall", "trip", "tumble", "topple"],
  ["sword", "blade", "katana", "longsword", "sabre", "saber", "fencing", "hema"],
  ["gun", "firearm", "pistol", "rifle", "shoot"],
  ["hit", "impact", "struck"],
  ["ragdoll", "euphoria"],
  ["mocap", "capture"],
  ["face", "facial", "expression"],
  ["angry", "anger", "rage", "frustrate"],
  ["slow", "slowmo", "slomo"],
  ["fight", "combat", "battle", "brawl"],
  ["heavy", "weight", "mass"],
  ["rig", "armature", "skeleton"],
  ["anticipation", "windup"],
  ["roblox", "r6", "r15"],
  ["turn", "pivot"],
  ["throw", "pitch", "toss"],
  ["cycle", "loop"],
];

const CJK = /[\u3040-\u30ff\u31f0-\u31ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/;
const CJK_RUN = /[\u3040-\u30ff\u31f0-\u31ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]+|[^\u3040-\u30ff\u31f0-\u31ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]+/g;
const CYRILLIC = /[\u0400-\u04ff]/;

/**
 * Lowercase, fold Latin/Cyrillic accents (ё → е, й → и), keep letters and digits
 * from every script, and collapse punctuation to spaces.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const RU_STOPWORDS = new Set([
  "и", "в", "во", "на", "с", "со", "по", "для", "как", "что", "это", "не", "из", "к", "о", "об", "от", "до", "при",
  "анимация", "анимации", "анимаций", "референс", "референсы", "урок", "уроки", "видео",
]);

// Longest first. A light suffix stripper: удары/ударов/удара → удар, тяжёлый/тяжёлые → тяжел.
const RU_ENDINGS = [
  "иями", "ями", "ами", "ого", "его", "ому", "ему", "ыми", "ими", "ешь", "ете", "ить", "ать", "ять", "еть",
  "ует", "ают", "яют", "ость", "ости", "ение", "ения", "ений", "ании", "ание", "аний",
  "ой", "ей", "ий", "ый", "ая", "яя", "ое", "ее", "ые", "ие", "ую", "юю", "ом", "ем", "ам", "ям", "ах", "ях", "ов", "ев", "ью",
  "а", "я", "ы", "и", "о", "е", "у", "ю", "ь", "й",
].sort((a, b) => b.length - a.length);

export function stemRu(word: string): string {
  for (const ending of RU_ENDINGS) {
    if (word.endsWith(ending) && word.length - ending.length >= 3) return word.slice(0, -ending.length);
  }
  return word;
}

/** Overlapping character pairs: the usual way to index Chinese and Japanese text without a dictionary. */
function bigrams(run: string): string[] {
  const chars = [...run];
  if (chars.length === 1) return chars;
  const out: string[] = [];
  for (let i = 0; i < chars.length - 1; i++) out.push(chars[i]! + chars[i + 1]!);
  return out;
}

/** Very light English stemmer — enough to match punches/punching/punched → punch. */
export function stem(word: string): string {
  if (word.length <= 3) return word;
  const rules: [RegExp, string][] = [
    [/ies$/, "y"],
    [/(ss)es$/, "$1"],
    [/(ch|sh|x|z)es$/, "$1"],
    [/([^s])s$/, "$1"],
    [/(.{3,}?)(ing)$/, "$1"],
    [/(.{3,}?)(ed)$/, "$1"],
  ];
  let result = word;
  for (const [pattern, replacement] of rules) {
    if (pattern.test(result)) {
      result = result.replace(pattern, replacement);
      break;
    }
  }
  // running -> runn -> run
  if (/(.)\1$/.test(result) && !/(ll|ss|zz)$/.test(result) && result.length > 3) {
    result = result.slice(0, -1);
  }
  // dodge/dodging -> dodg, pose/posing -> pos
  if (result.length > 3 && result.endsWith("e")) {
    result = result.slice(0, -1);
  }
  return result;
}

// Index synonyms by stem so they line up with tokenized text.
const synonymIndex = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) {
  const stems = [...new Set(group.map((w) => stem(normalize(w))))];
  for (const s of stems) {
    const others = stems.filter((w) => w !== s);
    synonymIndex.set(s, [...new Set([...(synonymIndex.get(s) ?? []), ...others])]);
  }
}

export function tokenize(text: string, { keepStopwords = false } = {}): string[] {
  const words = normalize(text).split(" ").filter(Boolean);
  const out: string[] = [];
  for (const word of words) {
    if (CJK.test(word)) {
      for (const part of word.match(CJK_RUN) ?? []) {
        if (CJK.test(part)) out.push(...bigrams(part));
        else if (part.length > 1) out.push(stem(part));
      }
      continue;
    }
    if (CYRILLIC.test(word)) {
      if (!keepStopwords && RU_STOPWORDS.has(word)) continue;
      out.push(stemRu(word));
      continue;
    }
    if (!keepStopwords && STOPWORDS.has(word)) continue;
    out.push(stem(word));
  }
  return out;
}

export function expandSynonyms(token: string): string[] {
  return synonymIndex.get(token) ?? [];
}
