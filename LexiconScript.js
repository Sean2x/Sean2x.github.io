//instaniate elements
const boardDiv = document.getElementById("grid");
const wordBar = document.getElementById("textbox");
const backspaceButton = document.getElementById("backspace");

const newSeedButtons = document.querySelectorAll(".new-seed");
const scoreWordButton = document.getElementById("scoreIt");
const scoreTotal = document.getElementById("scoreTotal");

const shuffleButton = document.getElementById("shuffle-board");
const topListDiv = document.getElementById("top-words");
const seedInput = document.getElementById("seed-input");
const setSeedButtons = document.querySelectorAll(".set-seed");
const wordScorePreview = document.getElementById("word-score-preview");

const gamemodeText = document.getElementById("gamemode");

const root = document.documentElement;

const Config = {
  grid: {
    size: 16,
  },

  letters: {
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",

    values: {
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
    },

    weights: {
      A: 4,
      E: 4,
      I: 3,
      O: 3,
      U: 2,
      N: 3,
      R: 3,
      T: 3,
      S: 3,
      L: 2,
      D: 3,
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
    },
  },

  scoring: {
    minWordLength: 3,

    colorTiers: [
      { threshold: 1.75, color: "#b09603" },
      { threshold: 1.25, color: "#838383" },
      { threshold: 1, color: "#5c2e06" },
    ],
  },

  GameModes: {
    ENDLESS: {
      id: "endless",
    },

    RANKED: {
      id: "ranked",
      maxRounds: 5,
    },

    TIMED: {
      id: "timed",
      duration: 60,
    },
  },

  rng: {
    seedMultiplier: 1000,
  },

  ui: {
    topWords: 5,
  },
};

const GameState = {
  score: 0,
  round: 1,
  mode: Config.GameModes.RANKED.id,

  grid: [],
  currentWord: "",
  usedTiles: [],

  topWords: [],
  wordHistory: [],

  baseSeed: null,
  timeLeft: null,

  dictionary: new Set(),
};

const today = new Date();

GameState.baseSeed = Number(
  `${today.getMonth() + 1}${today.getDate()}${today.getFullYear()}`,
);

let timerInterval = null;

async function loadGameStatedictionary() {
  const response = await fetch("Misc/wordlist-20210729.txt");
  const text = await response.text();

  const words = text.split(/\r?\n/);

  GameState.dictionary = new Set(
    words
      .map((w) =>
        w
          .trim()
          .replace(/^"+|"+$/g, "") // remove quotes at start/end
          .toUpperCase(),
      )
      .filter((w) => w.length > 0), // remove empty lines
  );
}
function getRandomLetter(rng) {
  const totalWeight = Object.values(Config.letters.weights).reduce(
    (sum, w) => sum + w,
    0,
  );

  let rand = rng() * totalWeight;

  for (const [letter, weight] of Object.entries(Config.letters.weights)) {
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
  loadGameStatedictionary();

  scoreTotal.textContent = `Score: ${GameState.score}`;
  boardDiv.innerHTML = "";
  wordBar.textContent = "";
  usedButtons.length = 0;
  updateWordState();

  // 🔥 KEY LINE: unique seed per round
  const roundSeed =
    GameState.baseSeed * Config.rng.seedMultiplier + GameState.round;
  const rng = createSeededRNG(roundSeed);

  for (let i = 0; i < Config.grid.size; i++) {
    const button = document.createElement("button");
    button.classList.add("square", "letter");

    const letter = getRandomLetter(rng); // "QU" if it's Q
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

    const orb = document.createElement("div");
    orb.classList.add("score-orb");

    const value =
      letter === "QU"
        ? Config.letters.values["Q"]
        : Config.letters.values[letter] || 0;

    orb.style.backgroundColor = getScoreColor(value);

    // optional: show value instead of letter
    // orb.textContent = value;

    button.appendChild(orb);

    boardDiv.appendChild(button);
  }

  // update UI
  document.getElementById("seed").textContent = `Seed: ${GameState.baseSeed}`;
  updateRoundDisplay();
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
newSeedButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = btn
      .closest(".modal, .right")
      ?.querySelector("input")
      ?.value.trim();

    // (optional) use input if you want, otherwise ignore

    GameState.baseSeed = Math.floor(Math.random() * 1000000);
    GameState.round = 1;
    GameState.score = 0;

    GameState.topWords = [];
    GameState.wordHistory = [];
    topListDiv.innerHTML = "";

    scoreTotal.textContent = `Score: ${GameState.score}`;

    startGame(GameState.mode);
  });
});

//scoring function
scoreWordButton.addEventListener("click", () => {
  if (wordBar.textContent.length === 0) return; // no word to score

  const word = wordBar.textContent.toUpperCase();

  if (wordBar.textContent.length <= 2) {
    previousTotal.innerHTML = `"${word}" is too short`;
    return;
  }

  if (!GameState.dictionary.has(word)) {
    previousTotal.innerHTML = `"${word}" is not a valid word`;
    return;
  }

  let wordScore = 0;

  for (let i = 0; i < word.length; i++) {
    if (word[i] === "Q" && word[i + 1] === "U") {
      wordScore += Config.letters.values["Q"];
      i++; // skip the U
    } else {
      wordScore += Config.letters.values[word[i]] || 0;
    }
  }

  GameState.score += wordScore;
  scoreTotal.innerHTML = `Score: ${GameState.score}`;
  // previousTotal.innerHTML = `Last word: ${word} (${wordScore} points)`;

  // --- TOP WORDS LOGIC ---
  // 🧾 Always track order
  GameState.wordHistory.push({ word, score: wordScore });

  // 🏆 Maintain top words (logic only)
  GameState.topWords.push({ word, score: wordScore });
  GameState.topWords.sort((a, b) => b.score - a.score);
  GameState.topWords = GameState.topWords.slice(0, 5);

  topListDiv.innerHTML = GameState.wordHistory
    .map((w, i) => `${i + 1}. ${w.word} (${w.score})`)
    .join("<br>");

  // topListDiv.innerHTML = GameState.topWords
  //   .map((w) => `${w.word} (${w.score})`)
  //   .join("<br>");

  handleRoundAdvance();
  updateWordState();
});

window.addEventListener("DOMContentLoaded", () => {
  loadGameStatedictionary();
  generateGrid(); // start game AFTER loading starts
});

function updateWordState() {
  const word = wordBar.textContent.toUpperCase();

  const isValid =
    word.length >= Config.scoring.minWordLength &&
    GameState.dictionary.has(word);

  // Enable / disable score button
  scoreWordButton.disabled = !isValid;

  // Glow effect
  if (isValid) {
    wordBar.classList.add("valid-word");
  } else {
    wordBar.classList.remove("valid-word");
  }

  // 🔥 NEW: score preview
  if (word.length < 3 || !GameState.dictionary.has(word)) {
    wordScorePreview.textContent = "Word Score: 0";
  } else {
    const previewScore = calculateWordScore(word);
    wordScorePreview.textContent = `Score: ${previewScore}`;
  }
}

shuffleButton.addEventListener("click", () => {
  const buttons = Array.from(boardDiv.querySelectorAll(".letter"));

  // Fisher–Yates shuffle (same logic, just on DOM nodes)
  for (let i = buttons.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [buttons[i], buttons[j]] = [buttons[j], buttons[i]];
  }

  // Re-append in new order
  buttons.forEach((btn) => boardDiv.appendChild(btn));

  // reset gameplay state
  wordBar.textContent = "";
  usedButtons.length = 0;

  // reset buttons
  buttons.forEach((btn) => {
    btn.disabled = false;
    btn.classList.remove("used");

    const letter = btn.textContent;
    btn.classList.toggle("qu", letter === "QU");
  });

  updateWordState();
});

function createSeededRNG(seed) {
  let value = seed;

  return function () {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

setSeedButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    let input = btn
      .closest(".modal, .right")
      .querySelector("input")
      .value.trim();

    if (!input) return;

    let newSeed;
    if (!isNaN(input)) {
      newSeed = Number(input);
    } else {
      newSeed = 0;
      for (let i = 0; i < input.length; i++) {
        newSeed += input.charCodeAt(i) * (i + 1);
      }
    }

    GameState.baseSeed = newSeed;
    GameState.round = 1;
    GameState.score = 0;
    GameState.topWords = [];
    GameState.wordHistory = [];
    topListDiv.innerHTML = "";

    startGame(GameState.mode);
  });
});

function calculateWordScore(word) {
  let score = 0;

  for (let i = 0; i < word.length; i++) {
    if (word[i] === "Q" && word[i + 1] === "U") {
      score += Config.letters.values["Q"];
      i++; // skip U
    } else {
      score += Config.letters.values[word[i]] || 0;
    }
  }

  return score;
}

function getScoreColor(value) {
  for (const tier of Config.scoring.colorTiers) {
    if (value >= tier.threshold) {
      return tier.color;
    }
  }
  return "#7c3d05"; // fallback
}

function startGame(mode) {
  GameState.mode = mode;

  GameState.score = 0;
  GameState.round = 1;
  GameState.topWords = [];
  GameState.wordHistory = [];
  topListDiv.innerHTML = "";

  scoreWordButton.disabled = false;
  backspaceButton.disabled = false;

  stopTimer(); // 🔥 always stop first

  if (mode === Config.GameModes.TIMED.id) {
    GameState.timeLeft = Config.GameModes.TIMED.duration;
    startTimer();
  } else {
    stopTimer();
  }

  generateGrid();
}

function handleRoundAdvance() {
  if (GameState.mode === Config.GameModes.ENDLESS.id) {
    GameState.round++;
    generateGrid();
  } else if (GameState.mode === Config.GameModes.RANKED.id) {
    if (GameState.round >= Config.GameModes.RANKED.maxRounds) {
      endGame();
    } else {
      GameState.round++;
      generateGrid();
    }
  } else if (GameState.mode === Config.GameModes.TIMED.id) {
    GameState.round++;
    // In timed mode, rounds don't matter
    generateGrid();
  }
}

function startTimer() {
  GameState.timeLeft = Config.GameModes.TIMED.duration;
  clearInterval(timerInterval); // 🔥 prevent stacking timers

  timerInterval = setInterval(() => {
    GameState.timeLeft -= 0.1;

    if (GameState.timeLeft <= 0) {
      GameState.timeLeft = 0;
      updateRoundDisplay();
      endGame();
      return;
    }

    updateRoundDisplay();
  }, 100);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function endGame() {
  stopTimer();

  showGameOver();

  // optional: disable board
  document.querySelectorAll(".letter").forEach((btn) => (btn.disabled = true));

  wordBar.textContent = "";

  // 🔥 Disable scoring
  scoreWordButton.disabled = true;
  backspaceButton.disabled = true;
}

document.getElementById("mode-endless").onclick = () => {
  gamemodeText.innerText = "Endless";
  startGame(Config.GameModes.ENDLESS.id);

  root.style.setProperty("--lightMain", "#17abb5");
  root.style.setProperty("--darkMain", "#0983b7");
  root.style.setProperty(
    "--glow",
    "0 0 10px #00acf57d, 0 0 20px #0097f512, 0 0 30px #00b4f533",
  );
  root.style.setProperty("--dimmed", "#17abb536");
};
document.getElementById("mode-ranked").onclick = () => {
  gamemodeText.innerText = "Ranked";
  startGame(Config.GameModes.RANKED.id);

  root.style.setProperty("--lightMain", "#b5179e");
  root.style.setProperty("--darkMain", "#7209b7");
  root.style.setProperty(
    "--glow",
    "0 0 10px #b5179d7d, 0 0 20px #b5179d12, 0 0 30px #b5179e33",
  );
  root.style.setProperty("--dimmed", "#b5179e36");
};
document.getElementById("mode-timed").onclick = () => {
  gamemodeText.innerText = "Timed";
  startGame(Config.GameModes.TIMED.id);

  root.style.setProperty("--lightMain", "#b2b517");
  root.style.setProperty("--darkMain", "#b7a909");
  root.style.setProperty(
    "--glow",
    "0 0 10px #abb5177d, 0 0 20px #b5b21712, 0 0 30px #9db51733",
  );
  root.style.setProperty("--dimmed", "#b2b51736");
};

function updateRoundDisplay() {
  const roundEl = document.getElementById("round");

  if (GameState.mode === Config.GameModes.TIMED.id) {
    roundEl.textContent = `Time: ${GameState.timeLeft.toFixed(1)}s`;
  } else if (GameState.mode === Config.GameModes.RANKED.id) {
    roundEl.textContent = `Round: ${GameState.round} / ${Config.GameModes.RANKED.maxRounds}`;
  } else {
    // Endless
    roundEl.textContent = `Round: ${GameState.round}`;
  }
}

function showGameOver() {
  const modal = document.getElementById("game-over-modal");
  const finalScoreEl = document.getElementById("final-score");
  const finaltopWordsEl = document.getElementById("final-top-words");

  finalScoreEl.textContent = `Score: ${GameState.score}`;

  if (GameState.topWords.length > 0) {
    // finaltopWordsEl.innerHTML = GameState.topWords
    //   .map((w, idx) => `${idx + 1}. ${w.word} (${w.score})`)
    //   .join("<br>");
    finaltopWordsEl.innerHTML = GameState.wordHistory
      .map((w, i) => `${i + 1}. ${w.word} (${w.score})`)
      .join("<br>");
  } else {
    finaltopWordsEl.textContent = "No words scored!";
  }

  modal.classList.add("show");
}

document.getElementById("try-again").addEventListener("click", () => {
  const modal = document.getElementById("game-over-modal");

  modal.classList.remove("show");
});

startGame(GameState.mode);

const modeButtons = document.querySelectorAll(
  "#mode-endless, #mode-ranked, #mode-timed",
);

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Remove selected from all buttons
    modeButtons.forEach((b) => b.classList.remove("selected"));
    modeButtons.forEach((b) => b.classList.remove("terminal-window"));

    // Add selected to clicked button
    button.classList.add("selected");
    button.classList.add("terminal-window");
  });
});
