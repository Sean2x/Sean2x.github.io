const fs = require("fs");

const inputFile = "Misc/en_US-large.dic";
const outputFile = "cleaned_words.txt";

const text = fs.readFileSync(inputFile, "utf-8");

// split lines
let words = text.split(/\r?\n/);

// skip first line if it’s a number (common in .dic files)
if (/^\d+$/.test(words[0].trim())) {
  words = words.slice(1);
}

// strip flags and apply filters
const cleaned = words.map(word => {
  const base = word.split("/")[0].trim();
  return base.toLowerCase(); // normalize to lowercase
}).filter(word => {
  return (
    word.length >= 3 &&
    word.length <= 16 &&
    /^[a-z]+$/.test(word) // only letters
  );
});

// remove duplicates
const unique = [...new Set(cleaned)];

// save
fs.writeFileSync(outputFile, unique.join("\n"));

console.log("Done! Cleaned dictionary saved as:", outputFile);