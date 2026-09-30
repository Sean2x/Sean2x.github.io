const fs = require("fs");

// === CONFIG ===
const inputFile = "Misc/en_US-large.dic";
const outputFile = "expanded_words.txt";

// read file
const text = fs.readFileSync(inputFile, "utf-8");
const lines = text.split(/\r?\n/);

// === HELPER FUNCTIONS ===

// pluralize regular nouns
function pluralize(word) {
  if (word.endsWith("y") && !/[aeiou]y$/.test(word)) {
    return word.slice(0, -1) + "ies";
  } else if (/(s|x|z|ch|sh)$/.test(word)) {
    return word + "es";
  } else {
    return word + "s";
  }
}

// conjugate regular verbs
function conjugate(word) {
  let base = word;
  let ing = word;
  let ed = word;

  // remove trailing 'e' for -ing, unless word ends with ee
  if (word.endsWith("e") && !word.endsWith("ee")) {
    base = word; // base stays the same
    ing = word.slice(0, -1) + "ing"; // make → making
    ed = word + "d";                 // make → maked? We'll fix to "made" if irregular
  } else {
    ing = word + "ing";
    ed = word + "ed";
  }

  return [word, word + "s", ed, ing];
}

// expand a word based on flags
function expandWord(word, flags) {
  const result = [word];

  const upperFlags = flags.toUpperCase();

  if (upperFlags.includes("S")) {
    // plural nouns
    result.push(pluralize(word));
  }

  // only generate full verb forms for /M, /G, /D, but not SM/MS
  if ((upperFlags.includes("M") || upperFlags.includes("G") || upperFlags.includes("D"))
      && !upperFlags.includes("SM") && !upperFlags.includes("MS")) {
    result.push(...conjugate(word));
  }

  return result;
}

// === PROCESS LINES ===
let expanded = [];

lines.forEach(line => {
  if (!line.trim()) return;

  // split at the first slash, if any
  const parts = line.split("/");
  const word = parts[0].toLowerCase().trim();
  const flags = parts[1] ? parts[1].toUpperCase() : "";

  // filter nonsense / short / long
  if (word.length < 2 || word.length > 16) return;
  if (!/^[a-z]+$/.test(word)) return;

  // expand
  expanded.push(...expandWord(word, flags));
});

// deduplicate
const unique = [...new Set(expanded)];

// write
fs.writeFileSync(outputFile, unique.join("\n"));

console.log(`Done! Expanded list saved as: ${outputFile}`);