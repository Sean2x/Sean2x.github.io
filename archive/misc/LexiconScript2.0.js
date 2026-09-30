// 1. Config
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

  gameModes: {
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
    maxTopWords: 5,
  },
};

// 2. State
const GameState = {
  score: 0,
  round: 1,
  mode: Config.gameModes.RANKED.id,

  grid: [],
  currentWord: "",
  usedTiles: [],

  topWords: [],

  seed: null,
  timeLeft: null,

  dictionary: new Set(),
};

// 3. Logic Elements

function createRNG(seed) {
  let value = seed;

  return function () {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function getRandomLetter(rng) {
  const weights = Config.letters.weights;

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

  let rand = rng() * totalWeight;

  for (const [letter, weight] of Object.entries(weights)) {
    if (rand < weight) {
      return letter === "Q" ? "QU" : letter;
    }
    rand -= weight;
  }

  return "E";
}

function generateGrid(state) {
  const seed = state.seed * Config.rng.seedMultiplier + state.round;

  const rng = createRNG(seed);

  const grid = [];

  for (let i = 0; i < Config.grid.size; i++) {
    grid.push(getRandomLetter(rng));
  }

  return grid;
}

function calculateWordScore(word) {
  const values = Config.letters.values;

  let score = 0;

  for (let i = 0; i < word.length; i++) {
    if (word[i] === "Q" && word[i + 1] === "U") {
      score += values["Q"];
      i++;
    } else {
      score += values[word[i]] || 0;
    }
  }

  return score;
}

function isValidWord(word, state) {
  return (
    word.length >= Config.scoring.minWordLength && state.dictionary.has(word)
  );
}

function getScoreColor(value) {
  for (const tier of Config.scoring.colorTiers) {
    if (value >= tier.threshold) return tier.color;
  }
  return "#7c3d05";
}

// 4. UI Elements
function renderGrid(state) {
  boardDiv.innerHTML = "";

  state.grid.forEach((letter, index) => {
    const button = document.createElement("button");
    button.textContent = letter;

    button.addEventListener("click", () => {
      handleTileClick(index);
    });

    boardDiv.appendChild(button);
  });
}

function handleTileClick(index) {
  const letter = GameState.grid[index];

  GameState.currentWord += letter;
  GameState.usedTiles.push(index);

  updateGame();
}

function updateGame() {
  renderGrid();
  renderWord();
  renderScore();
}

// 7. INIT
function init() {
  GameState.seed = Date.now();
  GameState.grid = generateGrid(GameState);
  updateGame();
}

init();
