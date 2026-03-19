//instaniate elements
const boardDiv = document.getElementById("grid");
const wordBar = document.getElementById("textbox");
const backspaceButton = document.getElementById("backspace");
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const newBoardButton = document.getElementById("new-board");
const scoreWordButton = document.getElementById("score");
const scoreTotal = document.getElementById("scoreTotal");
const previousTotal = document.getElementById("previousTotal");

const shuffleButton = document.getElementById("shuffle-board");
const topListDiv = document.getElementById("top-words");

const letterValues = {
  A: 1,
  D: 1,
  E: 1,
  G: 1,
  I: 1,
  L: 1,
  N: 1,
  O: 1,
  R: 1,
  S: 1,
  T: 1,
  U: 1,
  B: 1.25,
  C: 1.25,
  F: 1.25,
  H: 1.25,
  M: 1.25,
  P: 1.25,
  V: 1.5,
  W: 1.5,
  Y: 1.5,
  J: 1.75,
  K: 1.75,
  X: 2,
  Z: 2,
  Q: 2.75,
};

let totalScore = 0;

const letterWeights = {
  A: 4,
  E: 4,
  I: 3,
  O: 3,
  U: 2, // vowels slightly higher
  N: 3,
  R: 3,
  T: 3,
  S: 3,
  L: 2,
  D: 3, // consonants roughly equal
  C: 2,
  M: 2,
  P: 2,
  G: 2,
  H: 1,
  F: 1,
  Y: 1,
  W: 1,
  K: 1,
  B: 1,
  V: 1,
  X: 0.5,
  J: 0.5,
  Q: 0.5,
  Z: 0.5,
};

let topWords = []; // stores objects {word: "WORD", score: 12}

//dictionaty
let dictionary = new Set();

async function loadDictionary() {
  const response = await fetch("Misc/expanded_wordsV2.txt");
  const text = await response.text();

  const words = text.split(/\r?\n/);

  dictionary = new Set(words.map((w) => w.trim().toUpperCase()));

  console.log("Dictionary loaded:", dictionary.size, "words");
}

function getRandomLetter() {
  const totalWeight = Object.values(letterWeights).reduce(
    (sum, w) => sum + w,
    0,
  );

  let rand = Math.random() * totalWeight;

  for (const [letter, weight] of Object.entries(letterWeights)) {
    if (rand < weight) {
      return letter === "Q" ? "QU" : letter;
    }
    rand -= weight;
  }

  return "E";
}

const usedButtons = [];

// generate grid function
function generateGrid() {
  // Clear previous letters
  loadDictionary();

  boardDiv.innerHTML = "";
  wordBar.textContent = "";
  usedButtons.length = 0;

  for (let i = 0; i < 16; i++) {
    const button = document.createElement("button");
    button.classList.add("square", "letter");

    const letter = getRandomLetter(); // "QU" if it's Q
    button.textContent = letter;

    // Add a class if it's QU
    if (letter === "QU") {
      button.classList.add("qu");
    }
    button.textContent = letter;
    button.disabled = false;

    // click listener
    button.addEventListener("click", () => {
      wordBar.textContent += button.textContent;
      button.disabled = true;
      usedButtons.push(button); // track used button

      updateWordState();
    });

    boardDiv.appendChild(button);
  }
}

// backspace listener
backspaceButton.addEventListener("click", () => {
  if (wordBar.textContent.length === 0) return;

  let text = wordBar.textContent;

  let removedLetter;
  if (text.endsWith("QU")) {
    removedLetter = "QU";
    wordBar.textContent = text.slice(0, -2);
  } else {
    removedLetter = text.slice(-1);
    wordBar.textContent = text.slice(0, -1);
  }

  // reactivate last used button
  for (let i = usedButtons.length - 1; i >= 0; i--) {
    if (usedButtons[i].textContent === removedLetter) {
      usedButtons[i].disabled = false;
      usedButtons.splice(i, 1); // remove from used
      break;
    }
  }

  updateWordState();
});

// new board listener
newBoardButton.addEventListener("click", () => {
  generateGrid();
});

//scoring function
scoreWordButton.addEventListener("click", () => {
  if (wordBar.textContent.length === 0) return; // no word to score

  const word = wordBar.textContent.toUpperCase();

  if (wordBar.textContent.length <= 2) {
    previousTotal.innerHTML = `"${word}" is too short`;
    return;
  }

  if (!dictionary.has(word)) {
    previousTotal.innerHTML = `"${word}" is not a valid word`;
    return;
  }

  let wordScore = 0;

  for (let i = 0; i < word.length; i++) {
    if (word[i] === "Q" && word[i + 1] === "U") {
      wordScore += letterValues["Q"];
      i++; // skip the U
    } else {
      wordScore += letterValues[word[i]] || 0;
    }
  }

  totalScore += wordScore;
  scoreTotal.innerHTML = `Score: ${totalScore}`;
  previousTotal.innerHTML = `Last word: ${word} (${wordScore} points)`;

  // --- TOP WORDS LOGIC ---
  topWords.push({ word, score: wordScore });
  // sort descending by score
  topWords.sort((a, b) => b.score - a.score);
  // keep only top 5
  topWords = topWords.slice(0, 5);

  // display top 5 somewhere

  topListDiv.innerHTML = topWords
    .map((w) => `${w.word} (${w.score})`)
    .join("<br>");

  generateGrid();
  updateWordState();
});

window.addEventListener("DOMContentLoaded", () => {
  loadDictionary();
  generateGrid(); // start game AFTER loading starts
});

function updateWordState() {
  const word = wordBar.textContent.toUpperCase();

  const isValid = word.length >= 3 && dictionary.has(word);

  // Enable / disable score button
  scoreWordButton.disabled = !isValid;

  // Glow effect
  if (isValid) {
    wordBar.classList.add("valid-word");
  } else {
    wordBar.classList.remove("valid-word");
  }
}

shuffleButton.addEventListener("click", () => {
  // Get current letters from buttons
  const letters = Array.from(boardDiv.querySelectorAll(".letter")).map(
    (btn) => btn.textContent,
  );

  // Shuffle the array
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }

  // Reassign letters to buttons and reset state
  const buttons = boardDiv.querySelectorAll(".letter");
  buttons.forEach((btn, idx) => {
    btn.textContent = letters[idx];
    btn.disabled = false; // reactivate all letters
    btn.classList.toggle("qu", letters[idx] === "QU");
  });

  // Clear word bar and usedButtons
  wordBar.textContent = "";
  usedButtons.length = 0;
  updateWordState();
});
