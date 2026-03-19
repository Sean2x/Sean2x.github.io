const fs = require("fs");

// === CONFIG ===
const inputFile = "Misc/en_US-large.dic";
const outputFile = "Misc/expanded_wordsV3.txt";

// === HELPER FUNCTIONS ===

// Pluralize nouns
function pluralize(word) {
  const lw = word.toLowerCase();

  // irregulars
  if (lw === "mass") return "masses";
  if (lw === "child") return "children";
  if (lw === "person") return "people";
  if (lw === "man") return "men";
  if (lw === "woman") return "women";
  if (lw === "mouse") return "mice";
  if (lw === "goose") return "geese";

  // latin/greek
  if (lw.endsWith("us")) return word.slice(0, -2) + "i";
  if (lw.endsWith("a")) return word.slice(0, -1) + "ae";
  if (lw.endsWith("is")) return word.slice(0, -2) + "es";
  if (lw.endsWith("um")) return word.slice(0, -2) + "a";
  if (/(ex|ix)$/i.test(lw)) return word.slice(0, -2) + "ices";

  // y → ies
  if (word.endsWith("y") && !/[aeiou]y$/i.test(word)) {
    return word.slice(0, -1) + "ies";
  }

  // es endings
  if (/(s|x|z|ch|sh)$/i.test(word)) {
    return word + "es";
  }

  return word + "s";
}

// check for consonant-vowel-consonant pattern
function isCVC(word) {
  return /^[^aeiou]*[aeiou][^aeiou]$/i.test(word) && !/(w|x|y)$/i.test(word);
}

// Conjugate verbs (FIXED)
function conjugate(word) {
  const lw = word.toLowerCase();
  let forms = [];

  // irregulars
  if (lw === "make") return ["makes", "made", "making"];
  if (lw === "be") return ["is", "was", "being"];
  if (lw === "have") return ["has", "had", "having"];

  // --- THIRD PERSON ---
  if (word.endsWith("y") && !/[aeiou]y$/i.test(word)) {
    forms.push(word.slice(0, -1) + "ies");
  } else if (/(s|x|z|ch|sh)$/i.test(word)) {
    forms.push(word + "es");
  } else {
    forms.push(word + "s");
  }

  // --- PAST ---
  if (word.endsWith("e")) {
    forms.push(word + "d"); // vote → voted
  } else if (isCVC(word)) {
    forms.push(word + word.slice(-1) + "ed"); // stop → stopped
  } else {
    forms.push(word + "ed");
  }

  // --- ING ---
  if (word.endsWith("e") && lw !== "be") {
    forms.push(word.slice(0, -1) + "ing"); // vote → voting
  } else if (isCVC(word)) {
    forms.push(word + word.slice(-1) + "ing"); // run → running
  } else {
    forms.push(word + "ing");
  }

  return forms;
}

// Expand based on flags
function expandWord(word, flags) {
  const result = [word];
  const flagSet = new Set(flags.toUpperCase().split(""));

  // plural
  if (flagSet.has("S")) {
    result.push(pluralize(word));
  }

  // verbs
  if (
    flagSet.has("M") ||
    flagSet.has("D") ||
    flagSet.has("G") ||
    flagSet.has("J")
  ) {
    result.push(...conjugate(word));
  }

  // adjectives
  if (flagSet.has("R")) result.push(word + "er");
  if (flagSet.has("T")) result.push(word + "est");

  // adverbs
  if (flagSet.has("Y")) result.push(word + "ly");

  // irregular plural flag
  if (flagSet.has("Z")) {
    const lw = word.toLowerCase();
    if (lw.endsWith("a")) result.push(word.slice(0, -1) + "ae");
    if (lw.endsWith("us")) result.push(word.slice(0, -2) + "i");
    if (lw.endsWith("is")) result.push(word.slice(0, -2) + "es");
    if (lw.endsWith("um")) result.push(word.slice(0, -2) + "a");
    if (/(ex|ix)$/i.test(lw)) result.push(word.slice(0, -2) + "ices");
  }

  return result;
}

// === PROCESS ===
const text = fs.readFileSync(inputFile, "utf-8");
const lines = text.split(/\r?\n/);

let expanded = [];

lines.forEach((line) => {
  if (!line.trim()) return;

  const parts = line.split("/");
  const word = parts[0].trim().toLowerCase();
  const flags = parts[1] ? parts[1].trim() : "";

  // filter junk
  if (word.length < 2 || word.length > 16) return;
  if (!/^[a-z]+$/.test(word)) return;

  expanded.push(...expandWord(word, flags));
});

// dedupe
const unique = [...new Set(expanded)];

// save
fs.writeFileSync(outputFile, unique.join("\n"));

console.log(`Done! Expanded list saved as: ${outputFile}`);