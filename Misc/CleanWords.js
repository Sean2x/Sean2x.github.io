const fs = require("fs");

// change this to your file name
const inputFile = "2of12.txt";
const outputFile = "cleaned_words.txt";

const text = fs.readFileSync(inputFile, "utf-8");

// split by lines
const words = text.split(/\r?\n/);

// filter rules
const cleaned = words.filter(word => {
  const w = word.trim();

  return (
    w.length >= 3 &&
    w.length <= 16 &&
    !w.includes("'") &&
    !w.includes("-")
  );
});

// optional: remove duplicates
const unique = [...new Set(cleaned)];

// save result
fs.writeFileSync(outputFile, unique.join("\n"));

console.log("Done. Cleaned file saved as:", outputFile);