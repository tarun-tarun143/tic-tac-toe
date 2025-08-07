
window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("loadingScreen").style.display = "none";
    document.getElementById("modePopup").classList.remove("hidden");
  }, 1500); // wait 1.5 seconds before removing loader and showing mode popup
});

const board = document.getElementById("board");
const statusText = document.getElementById("status");
const scoreXElement = document.getElementById("scoreX");
const scoreOElement = document.getElementById("scoreO");
const roundIndicator = document.getElementById("roundIndicator");
const modePopup = document.getElementById("modePopup");
const namePopup = document.getElementById("namePopup");
const nextMatchPopup = document.getElementById("nextMatchPopup");
const roundResultText = document.getElementById("roundResultText");
const celebrationPopup = document.getElementById("celebrationPopup");
const winnerNameDisplay = document.getElementById("winnerNameDisplay");
const playAgainBtn = document.getElementById("playAgainBtn");

let cells = [];
let currentPlayer = "X";
let gameMode = "";
let playerXName = "Player X";
let playerOName = "Player O";
let scoreX = 0;
let scoreO = 0;
let round = 1;
let maxRounds = 10;
let isGameActive = true;

const playerColors = {
  X: "#e74c3c",
  O: "#3498db"
};

function startGame(mode) {
  gameMode = mode;
  modePopup.classList.add("hidden");
  if (mode === "friend") {
    namePopup.classList.remove("hidden");
  } else {
    playerOName = "Computer";
    namePopup.classList.remove("hidden");
    document.getElementById("playerOName").style.display = "none";
  }
}

function startGameWithNames() {
  const xName = document.getElementById("playerXName").value;
  const oName = document.getElementById("playerOName").value;
  if (xName.trim()) playerXName = xName;
  if (gameMode === "friend" && oName.trim()) playerOName = oName;
  namePopup.classList.add("hidden");
  document.getElementById("gameBoard").classList.remove("hidden");
  initBoard();
  updateStatus();
}

function initBoard() {
  board.innerHTML = "";
  cells = [];
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = i;
    cell.addEventListener("click", handleCellClick);
    board.appendChild(cell);
    cells.push(cell);
  }
}

function handleCellClick(e) {
  const cell = e.target;
  const index = cell.dataset.index;
  if (cell.textContent || !isGameActive) return;

  cell.textContent = currentPlayer;
  cell.classList.add("marked");
  cell.style.color = playerColors[currentPlayer];

  const winCombo = checkWin();
  if (winCombo) {
    handleWin(currentPlayer, winCombo);
  } else if (isDraw()) {
    handleDraw();
  } else {
    switchPlayer();
    updateStatus();
    if (gameMode === "computer" && currentPlayer === "O") {
      setTimeout(computerMove, 500);
    }
  }
}

function computerMove() {
  const bestMove = getBestMove();
  if (bestMove !== -1) {
    cells[bestMove].click();
  }
}

function getBestMove() {
  let bestScore = -Infinity;
  let move = -1;
  for (let i = 0; i < 9; i++) {
    if (!cells[i].textContent) {
      cells[i].textContent = "O";
      let score = minimax(cells, 0, false);
      cells[i].textContent = "";
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
}

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

const scores = {
  O: 1,
  X: -1,
  tie: 0
};

function checkWinner(cellsArray) {
  const winCombos = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
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

function switchPlayer() {
  currentPlayer = currentPlayer === "X" ? "O" : "X";
}

function updateStatus() {
  const playerName = currentPlayer === "X" ? playerXName : playerOName;
  statusText.innerHTML = `<span class="turn" style="color:${playerColors[currentPlayer]}">${playerName}'s Turn</span>`;
}

function handleWin(winner, winCombo) {
  isGameActive = false;
  if (winner === "X") {
    scoreX++;
    scoreXElement.textContent = `X: ${scoreX}`;
    scoreXElement.classList.add("animated");
  } else {
    scoreO++;
    scoreOElement.textContent = `O: ${scoreO}`;
    scoreOElement.classList.add("animated");
  }
  winCombo.forEach(i => cells[i].classList.add("highlight"));
  setTimeout(() => {
    scoreXElement.classList.remove("animated");
    scoreOElement.classList.remove("animated");
  }, 500);
  showNextMatch(`${winner === 'X' ? playerXName : playerOName} wins this round!`);
}

function handleDraw() {
  isGameActive = false;
  showNextMatch("It's a draw!");
}

function showNextMatch(message) {
  roundResultText.textContent = message;
  nextMatchPopup.classList.remove("hidden");
}

function nextRound() {
  nextMatchPopup.classList.add("hidden");
  round++;
  if (round > maxRounds) {
    celebrateMatchWinner();
  } else {
    roundIndicator.textContent = `Round ${round} / ${maxRounds}`;
    resetBoard();
    isGameActive = true;
    currentPlayer = "X";
    updateStatus();
  }
}

const nextMatch = nextRound;

function resetBoard() {
  cells.forEach(cell => {
    cell.textContent = "";
    cell.classList.remove("marked");
    cell.classList.remove("highlight");
  });
}

function checkWin() {
  const winCombos = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
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

function celebrateMatchWinner() {
  let finalWinner = "";
  if (scoreX > scoreO) {
    finalWinner = `${playerXName} Wins the Match! 🎉`;
  } else if (scoreO > scoreX) {
    finalWinner = `${playerOName} Wins the Match! 🎉`;
  } else {
    finalWinner = "It's a Tie Match! 🤝";
  }

  winnerNameDisplay.textContent = finalWinner;
  celebrationPopup.classList.remove("hidden");

  launchConfetti();

  playAgainBtn.addEventListener("click", () => {
    resetFullGame();
  });
}

function launchConfetti() {
  const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#9b59b6'];
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.animationDelay = `${Math.random()}s`;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 3000);
  }
}

function resetFullGame() {
  scoreX = 0;
  scoreO = 0;
  round = 1;
  scoreXElement.textContent = "X: 0";
  scoreOElement.textContent = "O: 0";
  roundIndicator.textContent = `Round 1 / ${maxRounds}`;
  celebrationPopup.classList.add("hidden");
  resetBoard();
  isGameActive = true;
  currentPlayer = "X";
  updateStatus();
}
