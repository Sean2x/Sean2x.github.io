//instaniate elements
const boardDiv = document.getElementById("grid");
const wordBar = document.getElementById("textbox");
const backspaceButton = document.getElementById("backspace");
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const newBoardButton = document.getElementById("new-board");
const scoreWordButton = document.getElementById("score");
const scoreTotal = document.getElementById("scoreTotal");
const previousTotal = document.getElementById("previousTotal");

const letterValues = {
    A: 1,
    B: 3,
    C: 3,
    D: 2,
    E: 1,
    F: 4,
    G: 2,
    H: 4,
    I: 1,
    J: 8,
    K: 5,
    L: 1,
    M: 3,
    N: 1,
    O: 1,
    P: 3,
    Q: 10,
    R: 1,
    S: 1,
    T: 1,
    U: 1,
    V: 4,
    W: 4,
    X: 8,
    Y: 4,
    Z: 10,
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

//dictionaty
let dictionary = new Set();

async function loadDictionary() {
    const response = await fetch("Misc/expanded_words.txt");
    const text = await response.text();

    const words = text.split(/\r?\n/);

    dictionary = new Set(
        words.map(w => w.trim().toUpperCase())
    );

    console.log("Dictionary loaded:", dictionary.size, "words");
}

function getRandomLetter() {
    const totalWeight = Object.values(letterWeights).reduce(
        (sum, w) => sum + w,
        0,
    );
    let rand = Math.random() * totalWeight;

    for (const [letter, weight] of Object.entries(letterWeights)) {
        if (rand < weight) return letter;
        rand -= weight;
    }

    // fallback (shouldn’t happen)
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

        const letter = getRandomLetter();
        button.textContent = letter;
        button.disabled = false;

        // click listener
        button.addEventListener("click", () => {
            wordBar.textContent += button.textContent;
            button.disabled = true;
            usedButtons.push(button); // track used button
        });

        boardDiv.appendChild(button);
    }
}


// backspace listener
backspaceButton.addEventListener("click", () => {
    if (wordBar.textContent.length === 0) return;

    const removedLetter = wordBar.textContent.slice(-1);
    wordBar.textContent = wordBar.textContent.slice(0, -1);

    // reactivate last used button
    for (let i = usedButtons.length - 1; i >= 0; i--) {
        if (usedButtons[i].textContent === removedLetter) {
            usedButtons[i].disabled = false;
            usedButtons.splice(i, 1); // remove from used
            break;
        }
    }
});

// new board listener
newBoardButton.addEventListener("click", () => {
    generateGrid();
});

//scoring function
scoreWordButton.addEventListener("click", () => {
    if (wordBar.textContent.length === 0) return; // no word to score
    if (wordBar.textContent.length < 2)  {
    previousTotal.innerHTML = `"${word}" is too short`;
    return;
  }
    const word = wordBar.textContent.toUpperCase();

    if (!dictionary.has(word)) {
    previousTotal.innerHTML = `"${word}" is not a valid word`;
    return;
  }

    let wordScore = 0;

    for (const char of word) {
        wordScore += letterValues[char] || 0; // add letter value
    }

    totalScore += wordScore;
    scoreTotal.innerHTML = `Score: ${totalScore}`;
    previousTotal.innerHTML = `Last word: ${word} (${wordScore} points)`;

    generateGrid();
});

window.addEventListener("DOMContentLoaded", () => {
  loadDictionary();
  generateGrid(); // start game AFTER loading starts
});