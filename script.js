// script.js (cleaned + fixes for duplicate popups & difficulty flow)

window.addEventListener("load", () => {
  setTimeout(() => {
    // Hide loader and show initial mode popup
    document.getElementById("loadingScreen").style.display = "none";
    const modePopup = document.getElementById("modePopup");
    if (modePopup) modePopup.classList.remove("hidden");
  }, 1500);
});


/* ---------- DOM refs ---------- */
const board = document.getElementById("board");
const statusText = document.getElementById("status");
const scoreXElement = document.getElementById("scoreX");
const scoreOElement = document.getElementById("scoreO");
const roundIndicator = document.getElementById("roundIndicator");


const difficultyPopup = document.getElementById("difficultyPopup");
const namePopup = document.getElementById("namePopup");
const nextMatchPopup = document.getElementById("nextMatchPopup");
const roundResultText = document.getElementById("roundResultText");
const winnerNameDisplay = document.getElementById("winnerNameDisplay");
const playAgainBtn = document.getElementById("playAgainBtn");
const homeBtn = document.getElementById("homeBtn");
const gameBoard = document.getElementById("gameBoard");
const modePopup = document.getElementById("modePopup");
const celebrationPopup = document.getElementById("celebrationPopup");
const settingsBtn = document.getElementById("settingsBtn");
const settingsPopup = document.getElementById("settingsPopup");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const settingsCloseBtn = document.getElementById("settingsCloseBtn");
const themeSelect = document.getElementById("themeSelect");
const bgMusic = document.getElementById("bgMusic");
const clickSound = document.getElementById("clickSound");
const winSound = document.getElementById("winSound");
const drawSound = document.getElementById("drawSound");

/* ---------- Game state ---------- */
let cells = [];
let currentPlayer = "X";
let gameMode = "";
let difficultyLevel = "";
let playerXName = "Player X";
let playerOName = "Player O";
let scoreX = 0;
let scoreO = 0;
let round = 1;
let maxRounds = 10;
let isGameActive = true;
let hideTimeout;

const playerColors = { X: "#e74c3c", O: "#3498db" };




/* ---------- Utility: hide all popups ---------- */
function hideAllPopups() {
  [modePopup, difficultyPopup, namePopup, nextMatchPopup, celebrationPopup].forEach(p => {
    if (p) p.classList.add("hidden");
  });
}

/* ---------- Start game mode (friend or computer) ---------- */
function startGame(mode) {
  // Prevent duplicate behavior if called multiple times quickly:
  if (!mode || (mode === gameMode && !modePopup.classList.contains("hidden"))) {
    // continue but ensure only correct popup shows
  }

  // Normalize: hide everything first
  hideAllPopups();
  gameMode = mode;

  if (mode === "friend") {
    // Show name popup (two players)
    if (namePopup) {
      document.getElementById("playerOName").style.display = "block";
      namePopup.classList.remove("hidden");
    }
  } else {
    // Computer mode -> first show difficulty popup only
    difficultyLevel = ""; // reset previous selection
    if (difficultyPopup) difficultyPopup.classList.remove("hidden");
  }
}

/* ---------- Difficulty selection ---------- */
function selectDifficulty(level) {
  difficultyLevel = level || "hard";
  // hide difficulty popup and show name popup (player O input hidden)
  if (difficultyPopup) difficultyPopup.classList.add("hidden");
  if (namePopup) {
    document.getElementById("playerOName").style.display = "none";
    namePopup.classList.remove("hidden");
  }
}
function goHome() {
  celebrationPopup.classList.add("hidden");
  gameBoard.classList.add("hidden");
  modePopup.classList.remove("hidden");
  resetFullGame(true); // optional: reset game state
}

homeBtn.addEventListener("click", goHome);

/* ---------- Start after entering names ---------- */
function startGameWithNames() {
  const xName = (document.getElementById("playerXName")?.value || "").trim();
  const oName = (document.getElementById("playerOName")?.value || "").trim();

  if (xName) playerXName = xName;
  if (gameMode === "friend" && oName) playerOName = oName;
  else playerOName = "Computer";

  // Hide popups and show game UI
  hideAllPopups();
  document.getElementById("gameBoard").classList.remove("hidden");

  // Reset & init board
  scoreX = 0; scoreO = 0;
  scoreXElement.textContent = scoreX;
  scoreOElement.textContent = scoreO;
  round = 1;
  roundIndicator.textContent = `Round ${round} / ${maxRounds}`;
  currentPlayer = "X";
  isGameActive = true;

  initBoard();
  updateStatus();
}

/* ---------- Board init + handlers ---------- */
function initBoard() {
  board.innerHTML = "";
  cells = [];
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = i;
    // remove any existing listeners by cloning, to be safe (avoids duplicates)
    const newCell = cell.cloneNode(true);
    newCell.addEventListener("click", handleCellClick);
    board.appendChild(newCell);
    cells.push(newCell);
  }
}

/* ---------- Click handler ---------- */
function handleCellClick(e) {
  const cell = e.currentTarget;
  if (!cell || !isGameActive || cell.textContent) return;

  cell.textContent = currentPlayer;
  cell.classList.add("marked");
  cell.style.color = playerColors[currentPlayer];

  const winCombo = checkWin();
  if (winCombo) {
    handleWin(currentPlayer, winCombo);
    return;
  }

  if (isDraw()) {
    handleDraw();
    return;
  }

  switchPlayer();
  updateStatus();

  // If playing computer and it's O's turn, schedule computer move
  if (gameMode === "computer" && currentPlayer === "O") {
    setTimeout(computerMove, 400);
  }
}

/* ---------- Computer AI: difficulty-aware ---------- */
function computerMove() {
  let move = -1;
  if (difficultyLevel === "easy") {
    move = getRandomMove();
  } else if (difficultyLevel === "medium") {
    move = getMediumMove();
  } else {
    move = getBestMove(); // hard -> minimax
  }
  if (move >= 0 && cells[move] && !cells[move].textContent) {
    // emulate click so same flow happens
    cells[move].click();
  }
}

function getRandomMove() {
  const available = cells.map((c, i) => (!c.textContent ? i : -1)).filter(i => i >= 0);
  if (!available.length) return -1;
  return available[Math.floor(Math.random() * available.length)];
}

function getMediumMove() {
  // 1) Try to win
  for (let i = 0; i < 9; i++) {
    if (!cells[i].textContent) {
      cells[i].textContent = "O";
      if (checkWinner(cells) === "O") { cells[i].textContent = ""; return i; }
      cells[i].textContent = "";
    }
  }
  // 2) Try to block X
  for (let i = 0; i < 9; i++) {
    if (!cells[i].textContent) {
      cells[i].textContent = "X";
      if (checkWinner(cells) === "X") { cells[i].textContent = ""; return i; }
      cells[i].textContent = "";
    }
  }
  // 3) Center -> corner -> random
  if (!cells[4].textContent) return 4;
  const corners = [0,2,6,8].filter(i => !cells[i].textContent);
  if (corners.length) return corners[Math.floor(Math.random()*corners.length)];
  return getRandomMove();
}

function getBestMove() {
  let bestScore = -Infinity;
  let move = -1;
  for (let i = 0; i < 9; i++) {
    if (!cells[i].textContent) {
      cells[i].textContent = "O";
      const score = minimax(cells, 0, false);
      cells[i].textContent = "";
      if (score > bestScore) { bestScore = score; move = i; }
    }
  }
  return move;
}

/* ---------- Minimax + helpers ---------- */
const scores = { O: 1, X: -1, tie: 0 };

function minimax(boardState, depth, isMaximizing) {
  const result = checkWinner(boardState);
  if (result !== null) return scores[result];

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!boardState[i].textContent) {
        boardState[i].textContent = "O";
        best = Math.max(best, minimax(boardState, depth + 1, false));
        boardState[i].textContent = "";
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!boardState[i].textContent) {
        boardState[i].textContent = "X";
        best = Math.min(best, minimax(boardState, depth + 1, true));
        boardState[i].textContent = "";
      }
    }
    return best;
  }
}

/* ---------- Winner / draw detection ---------- */
function checkWinner(cellsArray) {
  const winCombos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let combo of winCombos) {
    const [a,b,c] = combo;
    if (cellsArray[a].textContent &&
        cellsArray[a].textContent === cellsArray[b].textContent &&
        cellsArray[a].textContent === cellsArray[c].textContent) {
      return cellsArray[a].textContent;
    }
  }
  if (cellsArray.every(cell => cell.textContent)) return "tie";
  return null;
}

/* For board cells (returns combo or null) */
function checkWin() {
  const winCombos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let combo of winCombos) {
    const [a,b,c] = combo;
    if (cells[a].textContent &&
        cells[a].textContent === cells[b].textContent &&
        cells[a].textContent === cells[c].textContent) {
      return combo;
    }
  }
  return null;
}

function isDraw() {
  return cells.every(cell => cell.textContent);
}

/* ---------- Game flow helpers ---------- */
function switchPlayer() { currentPlayer = currentPlayer === "X" ? "O" : "X"; }

function updateStatus() {
  const playerName = currentPlayer === "X" ? playerXName : playerOName;
  if (statusText) statusText.innerHTML = `<span class="turn" style="color:${playerColors[currentPlayer]}">${playerName}'s Turn</span>`;
}

function handleWin(winner, winCombo) {
  isGameActive = false;
  if (winner === "X") {
    scoreX++;
    scoreXElement.textContent = scoreX;
  } else {
    scoreO++;
    scoreOElement.textContent = scoreO;
  }
  // highlight winning cells
  winCombo.forEach(i => cells[i].classList.add("highlight"));

  showNextMatch(`${winner === 'X' ? playerXName : playerOName} wins this round!`);
}

function handleDraw() {
  isGameActive = false;
  showNextMatch("It's a draw!");
}

function showNextMatch(message) {
  if (roundResultText) roundResultText.textContent = message;
  if (nextMatchPopup) nextMatchPopup.classList.remove("hidden");
}

function nextRound() {
  if (nextMatchPopup) nextMatchPopup.classList.add("hidden");
  round++;
  if (round > maxRounds) {
    celebrateMatchWinner();
    return;
  }
  roundIndicator.textContent = `Round ${round} / ${maxRounds}`;
  resetBoard();
  isGameActive = true;
  currentPlayer = "X";
  updateStatus();
}

const nextMatch = nextRound;

function resetBoard() {
  cells.forEach(cell => {
    cell.textContent = "";
    cell.classList.remove("marked", "highlight");
  });
}

/* ---------- End of match celebration ---------- */
function celebrateMatchWinner() {
  let finalWinner = "";
  if (scoreX > scoreO) finalWinner = `${playerXName} Wins the Match! 🎉`;
  else if (scoreO > scoreX) finalWinner = `${playerOName} Wins the Match! 🎉`;
  else finalWinner = "It's a Tie Match! 🤝";

  if (winnerNameDisplay) winnerNameDisplay.textContent = finalWinner;
  if (celebrationPopup) celebrationPopup.classList.remove("hidden");
  launchConfetti();

  // ensure not stacking handlers: assign onclick once
  if (playAgainBtn) playAgainBtn.onclick = resetFullGame;
}

function launchConfetti() {
  const colors = ['#e74c3c','#f1c40f','#2ecc71','#9b59b6'];
  for (let i = 0; i < 80; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random()*100}%`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random()*colors.length)];
    confetti.style.animationDelay = `${Math.random()*1.5}s`;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 3000);
  }
}

function resetFullGame() {
  scoreX = 0; scoreO = 0; round = 1;
  scoreXElement.textContent = scoreX;
  scoreOElement.textContent = scoreO;
  roundIndicator.textContent = `Round ${round} / ${maxRounds}`;
  if (celebrationPopup) celebrationPopup.classList.add("hidden");
  resetBoard();
  isGameActive = true;
  currentPlayer = "X";
  updateStatus();
}

// Load saved theme on page load
window.addEventListener("load", () => {
  const savedTheme = localStorage.getItem("selectedTheme") || "default";
  themeSelect.value = savedTheme;
  applyTheme(savedTheme);
});

// When user changes theme
themeSelect.addEventListener("change", function () {
  const selected = this.value;
  applyTheme(selected);
  localStorage.setItem("selectedTheme", selected);
});

function applyTheme(theme) {
  document.body.classList.remove("dark-theme", "light-theme", "default-theme");

  if (theme === "dark") {
    document.body.classList.add("dark-theme");
  } else if (theme === "light") {
    document.body.classList.add("light-theme");
  } else {
    document.body.classList.add("default-theme");
  }
}
function openSettings() {
  settingsPopup.classList.remove("hidden");
  resetAutoClose();
}

function closeSettings() {
  settingsPopup.classList.add("hidden");
  clearTimeout(hideTimeout);
}

function resetAutoClose() {
  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => {
    closeSettings();
  }, 5000); // auto-close after 5s
}

settingsBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  openSettings();
});

settingsCloseBtn.addEventListener("click", closeSettings);

document.addEventListener("click", (e) => {
  if (!settingsPopup.contains(e.target) && !settingsBtn.contains(e.target)) {
    closeSettings();
  }
});

// Start music when page loads
window.addEventListener("load", () => {
  // Some browsers require user interaction before playing audio
  document.body.addEventListener("click", startMusicOnce, { once: true });
});

function startMusicOnce() {
  bgMusic.volume = 0.5; // 50% volume
  bgMusic.play().catch(err => console.log("Music blocked until user interacts."));
}

// Optional: Toggle mute button
function toggleMusic() {
  if (bgMusic.paused) {
    bgMusic.play();
  } else {
    bgMusic.pause();
  }
}

// Keep popup open while interacting
settingsPopup.addEventListener("click", resetAutoClose);
/* ---------- Export functions to global so onclick="" in HTML keeps working ---------- */
window.startGame = startGame;
window.selectDifficulty = selectDifficulty;
window.startGameWithNames = startGameWithNames;
window.nextMatch = nextMatch;
