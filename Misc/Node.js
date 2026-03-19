const fs = require("fs");

// === CONFIG ===
const inputFile = "Misc/en_US-large.dic"; // your input dictionary
const outputFile = "expanded_wordsV2.txt"; // output file

// === HELPER FUNCTIONS ===

// Pluralize regular and irregular nouns
function pluralize(word) {
  const lw = word.toLowerCase();

  // hard-coded irregulars
  if (lw === "mass") return "masses";
  if (lw === "child") return "children";
  if (lw === "person") return "people";
  if (lw === "man") return "men";
  if (lw === "woman") return "women";
  if (lw === "mouse") return "mice";
  if (lw === "goose") return "geese";

  // common Latin/Greek endings
  if (lw.endsWith("us")) return word.slice(0, -2) + "i"; // cactus → cacti
  if (lw.endsWith("a")) return word.slice(0, -1) + "ae"; // cochlea → cochleae
  if (lw.endsWith("is")) return word.slice(0, -2) + "es"; // axis → axes
  if (lw.endsWith("um")) return word.slice(0, -2) + "a"; // bacterium → bacteria
  if (/(ex|ix)$/i.test(lw)) return word.slice(0, -2) + "ices"; // index → indices

  // words ending in y after consonant → ies
  if (word.endsWith("y") && !/[aeiou]y$/i.test(word)) {
    return word.slice(0, -1) + "ies";
  }

  // words ending in s, x, z, ch, sh → es
  if (/(s|x|z|ch|sh)$/i.test(word)) {
    return word + "es";
  }

  return word + "s";
}

// Conjugate regular verbs
function conjugate(word) {
  const lw = word.toLowerCase();
  let forms = [];

  // handle irregular verbs
  if (lw === "make") {
    forms.push("makes", "made", "making");
  } else if (lw === "be") {
    forms.push("is", "was", "being");
  } else if (lw === "have") {
    forms.push("has", "had", "having");
  } else {
    // normal verb endings
    // third person singular
    if (word.endsWith("y") && !/[aeiou]y$/i.test(word)) {
      forms.push(word.slice(0, -1) + "ies"); // carry → carries
    } else if (/(s|x|z|ch|sh)$/i.test(word)) {
      forms.push(word + "es"); // fix → fixes
    } else {
      forms.push(word + "s");
    }
    forms.push(word + "ed");
    forms.push(word + "ing");
  }

  return forms;
}

// Expand a word based on flags
function expandWord(word, flags) {
  const result = [word];
  const flagSet = new Set(flags.toUpperCase().split(""));

  // Noun plural
  if (flagSet.has("S")) {
    result.push(pluralize(word));
  }

  // Verb expansions
  if (
    flagSet.has("M") ||
    flagSet.has("D") ||
    flagSet.has("G") ||
    flagSet.has("J")
  ) {
    result.push(...conjugate(word));
  }

  // Adjective comparative / superlative
  if (flagSet.has("R")) result.push(word + "er");
  if (flagSet.has("T")) result.push(word + "est");

  // Adverb
  if (flagSet.has("Y")) result.push(word + "ly");

  // Irregular plurals from Z flag
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

// === PROCESS DICTIONARY ===
const text = fs.readFileSync(inputFile, "utf-8");
const lines = text.split(/\r?\n/);

let expanded = [];

lines.forEach((line) => {
  if (!line.trim()) return;

  // Split word and flags
  const parts = line.split("/");
  const word = parts[0].trim().toLowerCase();
  const flags = parts[1] ? parts[1].trim() : "";

  // Filter nonsense
  if (word.length < 2 || word.length > 16) return;
  if (!/^[a-z]+$/.test(word)) return;

  expanded.push(...expandWord(word, flags));
});

// Remove duplicates
const unique = [...new Set(expanded)];

// Save to file
fs.writeFileSync(outputFile, unique.join("\n"));
console.log(`Done! Expanded list saved as: ${outputFile}`);
