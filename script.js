const cells = Array.from(document.querySelectorAll(".cell"));
const statusText = document.querySelector("#statusText");
const modeButtons = Array.from(document.querySelectorAll(".mode-button"));
const markButtons = Array.from(document.querySelectorAll(".mark-button"));
const resetRoundButton = document.querySelector("#resetRound");
const resetMatchButton = document.querySelector("#resetMatch");
const themeToggle = document.querySelector("#themeToggle");
const xScore = document.querySelector("#xScore");
const oScore = document.querySelector("#oScore");
const drawScore = document.querySelector("#drawScore");
const xLabel = document.querySelector("#xLabel");
const oLabel = document.querySelector("#oLabel");

const wins = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

let board = Array(9).fill("");
let currentPlayer = "X";
let gameMode = "human";
let humanMark = "X";
let gameOver = false;
let scores = { X: 0, O: 0, draw: 0 };

function opponent(mark) {
  return mark === "X" ? "O" : "X";
}

function updateLabels() {
  if (gameMode === "ai") {
    xLabel.textContent = humanMark === "X" ? "You (X)" : "AI (X)";
    oLabel.textContent = humanMark === "O" ? "You (O)" : "AI (O)";
    return;
  }

  xLabel.textContent = "Player X";
  oLabel.textContent = "Player O";
}

function updateScores() {
  xScore.textContent = scores.X;
  oScore.textContent = scores.O;
  drawScore.textContent = scores.draw;
}

function renderBoard() {
  cells.forEach((cell, index) => {
    const mark = board[index];
    cell.textContent = mark;
    cell.className = "cell";
    if (mark) {
      cell.classList.add(mark.toLowerCase());
    }
    cell.disabled = Boolean(mark) || gameOver || isAiTurn();
    cell.setAttribute("aria-label", mark ? `Cell ${index + 1}, ${mark}` : `Cell ${index + 1}, empty`);
  });
}

function setStatus(message) {
  statusText.textContent = message;
}

function isAiTurn() {
  return gameMode === "ai" && currentPlayer !== humanMark && !gameOver;
}

function getWinner(currentBoard = board) {
  for (const combo of wins) {
    const [a, b, c] = combo;
    if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
      return { mark: currentBoard[a], combo };
    }
  }

  if (currentBoard.every(Boolean)) {
    return { mark: "draw", combo: [] };
  }

  return null;
}

function finishGame(result) {
  gameOver = true;

  if (result.mark === "draw") {
    scores.draw += 1;
    setStatus("Round draw");
  } else {
    scores[result.mark] += 1;
    result.combo.forEach((index) => cells[index].classList.add("win"));
    if (gameMode === "ai") {
      setStatus(result.mark === humanMark ? "You win" : "AI wins");
    } else {
      setStatus(`Player ${result.mark} wins`);
    }
  }

  updateScores();
  renderBoard();
  result.combo.forEach((index) => cells[index].classList.add("win"));
}

function playMove(index) {
  if (board[index] || gameOver || isAiTurn()) {
    return;
  }

  board[index] = currentPlayer;
  const result = getWinner();

  if (result) {
    finishGame(result);
    return;
  }

  currentPlayer = opponent(currentPlayer);
  setStatus(gameMode === "ai" && currentPlayer !== humanMark ? "AI is thinking" : `${turnOwner()} turn`);
  renderBoard();

  if (isAiTurn()) {
    window.setTimeout(makeAiMove, 420);
  }
}

function turnOwner() {
  if (gameMode === "ai") {
    return currentPlayer === humanMark ? "Your" : "AI";
  }

  return `Player ${currentPlayer}`;
}

function makeAiMove() {
  if (!isAiTurn()) {
    return;
  }

  const aiMark = opponent(humanMark);
  const index = chooseBestMove(aiMark);
  board[index] = aiMark;

  const result = getWinner();
  if (result) {
    finishGame(result);
    return;
  }

  currentPlayer = humanMark;
  setStatus("Your turn");
  renderBoard();
}

function chooseBestMove(aiMark) {
  const empty = board
    .map((mark, index) => (mark ? null : index))
    .filter((index) => index !== null);

  const tacticalMove = findImmediateMove(aiMark) ?? findImmediateMove(opponent(aiMark));
  if (tacticalMove !== null && tacticalMove !== undefined) {
    return tacticalMove;
  }

  if (board[4] === "") {
    return 4;
  }

  const corners = [0, 2, 6, 8].filter((index) => board[index] === "");
  if (corners.length) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  return empty[Math.floor(Math.random() * empty.length)];
}

function findImmediateMove(mark) {
  for (const index of board.keys()) {
    if (board[index]) {
      continue;
    }

    const testBoard = [...board];
    testBoard[index] = mark;
    if (getWinner(testBoard)?.mark === mark) {
      return index;
    }
  }

  return null;
}

function resetRound() {
  board = Array(9).fill("");
  currentPlayer = "X";
  gameOver = false;
  updateLabels();
  setStatus(gameMode === "ai" && humanMark === "O" ? "AI is thinking" : `${turnOwner()} starts`);
  renderBoard();

  if (isAiTurn()) {
    window.setTimeout(makeAiMove, 420);
  }
}

function resetMatch() {
  scores = { X: 0, O: 0, draw: 0 };
  updateScores();
  resetRound();
}

function setMode(mode) {
  gameMode = mode;
  modeButtons.forEach((button) => button.classList.toggle("active", button.dataset.mode === mode));
  document.querySelector(".mark-switch").style.display = mode === "ai" ? "grid" : "none";
  resetMatch();
}

function setHumanMark(mark) {
  humanMark = mark;
  markButtons.forEach((button) => button.classList.toggle("active", button.dataset.mark === mark));
  resetMatch();
}

cells.forEach((cell) => {
  cell.addEventListener("click", () => playMove(Number(cell.dataset.index)));
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

markButtons.forEach((button) => {
  button.addEventListener("click", () => setHumanMark(button.dataset.mark));
});

resetRoundButton.addEventListener("click", resetRound);
resetMatchButton.addEventListener("click", resetMatch);
themeToggle.addEventListener("click", () => document.body.classList.toggle("dark"));

setMode("human");
