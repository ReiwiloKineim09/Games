document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('board');
    const statusElement = document.getElementById('status');
    const newGameButton = document.getElementById('new-game-button');
    const difficultySelect = document.getElementById('difficulty');
    const moveHistoryElement = document.getElementById('move-history');
    const undoButton = document.getElementById('undo-button');
    const redoButton = document.getElementById('redo-button');
    const hintButton = document.getElementById('hint-button');
    const timeControlSelect = document.getElementById('time-control');
    const whiteTimerElement = document.getElementById('white-timer');
    const blackTimerElement = document.getElementById('black-timer');

    const PIECES = {
        'wP': '♙', 'wR': '♖', 'wN': '♘', 'wB': '♗', 'wQ': '♕', 'wK': '♔',
        'bP': '♟', 'bR': '♜', 'bN': '♞', 'bB': '♝', 'bQ': '♛', 'bK': '♚'
    };
    const TIME_CONTROLS = {
        '5_0': { time: 5 * 60 * 1000, increment: 0 },
        '5_3': { time: 5 * 60 * 1000, increment: 3 * 1000 },
        '10_0': { time: 10 * 60 * 1000, increment: 0 },
        '10_5': { time: 10 * 60 * 1000, increment: 5 * 1000 },
        '99_0': { time: 99 * 60 * 1000, increment: 0 } // "No limit"
    };
    
    // 1. Basic figure values
    const pieceValues = {
        'P': 100, 'N': 320, 'B': 330, 'R': 500, 'Q': 900, 'K': 20000
    };

    // 2. Piece-Square Tables for the OPENING/MIDDLEGAME
    // Values encourage: centralization of pieces, castling of the king, development of pawns.
    const pst_opening_white = {
        'P': [
          [0,  0,  0,  0,  0,  0,  0,  0],
          [50, 50, 50, 50, 50, 50, 50, 50],
          [10, 10, 20, 30, 30, 20, 10, 10],
          [5,  5, 10, 25, 25, 10,  5,  5],
          [0,  0,  0, 20, 20,  0,  0,  0],
          [5, -5,-10,  0,  0,-10, -5,  5],
          [5, 10, 10,-20,-20, 10, 10,  5],
          [0,  0,  0,  0,  0,  0,  0,  0]
      ],
      'N': [
          [-50,-40,-30,-30,-30,-30,-40,-50],
          [-40,-20,  0,  0,  0,  0,-20,-40],
          [-30,  0, 10, 15, 15, 10,  0,-30],
          [-30,  5, 15, 20, 20, 15,  5,-30],
          [-30,  0, 15, 20, 20, 15,  0,-30],
          [-30,  5, 10, 15, 15, 10,  5,-30],
          [-40,-20,  0,  5,  5,  0,-20,-40],
          [-50,-40,-30,-30,-30,-30,-40,-50]
      ],
      'B': [
          [-20,-10,-10,-10,-10,-10,-10,-20],
          [-10,  0,  0,  0,  0,  0,  0,-10],
          [-10,  0,  5, 10, 10,  5,  0,-10],
          [-10,  5,  5, 10, 10,  5,  5,-10],
          [-10,  0, 10, 10, 10, 10,  0,-10],
          [-10, 10, 10, 10, 10, 10, 10,-10],
          [-10,  5,  0,  0,  0,  0,  5,-10],
          [-20,-10,-10,-10,-10,-10,-10,-20]
      ],
      'R': [
          [0,  0,  0,  0,  0,  0,  0,  0],
          [5, 10, 10, 10, 10, 10, 10,  5],
          [-5,  0,  0,  0,  0,  0,  0, -5],
          [-5,  0,  0,  0,  0,  0,  0, -5],
          [-5,  0,  0,  0,  0,  0,  0, -5],
          [-5,  0,  0,  0,  0,  0,  0, -5],
          [-5,  0,  0,  0,  0,  0,  0, -5],
          [0,  0,  0,  5,  5,  0,  0,  0]
      ],
      'Q': [
          [-20,-10,-10, -5, -5,-10,-10,-20],
          [-10,  0,  0,  0,  0,  0,  0,-10],
          [-10,  0,  5,  5,  5,  5,  0,-10],
          [-5,  0,  5,  5,  5,  5,  0, -5],
          [0,  0,  5,  5,  5,  5,  0, -5],
          [-10,  5,  5,  5,  5,  5,  0,-10],
          [-10,  0,  5,  0,  0,  0,  0,-10],
          [-20,-10,-10, -5, -5,-10,-10,-20]
      ],
      'K': [ // King in the opening - safe in the corner
          [ -30, -40, -40, -50, -50, -40, -40, -30],
          [ -30, -40, -40, -50, -50, -40, -40, -30],
          [ -30, -40, -40, -50, -50, -40, -40, -30],
          [ -30, -40, -40, -50, -50, -40, -40, -30],
          [ -20, -30, -30, -40, -40, -30, -30, -20],
          [ -10, -20, -20, -20, -20, -20, -20, -10],
          [  20,  20,   0,   0,   0,   0,  20,  20],
          [  20,  30,  10,   0,   0,  10,  30,  20]
      ]
  };

  // 3. Piece-Square Tables for the END
  // Values encourage: activating the king, pushing pawns towards promotion.
  const pst_endgame_white = {
      'P': [
          [0,  0,  0,  0,  0,  0,  0,  0],
          [80, 80, 80, 80, 80, 80, 80, 80],
          [60, 60, 60, 60, 60, 60, 60, 60],
          [40, 40, 40, 40, 40, 40, 40, 40],
          [30, 30, 30, 30, 30, 30, 30, 30],
          [20, 20, 20, 20, 20, 20, 20, 20],
          [10, 10, 10, 10, 10, 10, 10, 10],
          [0,  0,  0,  0,  0,  0,  0,  0]
      ],
      'N': [
          [-50,-40,-30,-30,-30,-30,-40,-50],
          [-40,-20,  0,  5,  5,  0,-20,-40],
          [-30,  5, 10, 15, 15, 10,  5,-30],
          [-30,  0, 15, 20, 20, 15,  0,-30],
          [-30,  5, 15, 20, 20, 15,  5,-30],
          [-30,  0, 10, 15, 15, 10,  0,-30],
          [-40,-20,  0,  0,  0,  0,-20,-40],
          [-50,-40,-30,-30,-30,-30,-40,-50]
      ],
      'B': [
          [-20,-10,-10,-10,-10,-10,-10,-20],
          [-10,  0,  0,  0,  0,  0,  0,-10],
          [-10,  0,  5, 10, 10,  5,  0,-10],
          [-10,  5,  5, 10, 10,  5,  5,-10],
          [-10,  0, 10, 10, 10, 10,  0,-10],
          [-10, 10, 10, 10, 10, 10, 10,-10],
          [-10,  5,  0,  0,  0,  0,  5,-10],
          [-20,-10,-10,-10,-10,-10,-10,-20]
      ],
      'R': [
          [0,  0,  0,  0,  0,  0,  0,  0],
          [5, 10, 10, 10, 10, 10, 10,  5],
          [-5,  0,  0,  0,  0,  0,  0, -5],
          [-5,  0,  0,  0,  0,  0,  0, -5],
          [-5,  0,  0,  0,  0,  0,  0, -5],
          [-5,  0,  0,  0,  0,  0,  0, -5],
          [-5,  0,  0,  0,  0,  0,  0, -5],
          [0,  0,  0,  5,  5,  0,  0,  0]
      ],
      'Q': [
          [-20,-10,-10, -5, -5,-10,-10,-20],
          [-10,  0,  0,  0,  0,  0,  0,-10],
          [-10,  0,  5,  5,  5,  5,  0,-10],
          [-5,  0,  5,  5,  5,  5,  0, -5],
          [0,  0,  5,  5,  5,  5,  0, -5],
          [-10,  5,  5,  5,  5,  5,  0,-10],
          [-10,  0,  5,  0,  0,  0,  0,-10],
          [-20,-10,-10, -5, -5,-10,-10,-20]
      ],
      'K': [ // King in the end - active in the center
          [-50,-40,-30,-20,-20,-30,-40,-50],
          [-30,-20,-10,  0,  0,-10,-20,-30],
          [-30,-10, 20, 30, 30, 20,-10,-30],
          [-30,-10, 30, 40, 40, 30,-10,-30],
          [-30,-10, 30, 40, 40, 30,-10,-30],
          [-30,-10, 20, 30, 30, 20,-10,-30],
          [-30,-30,  0,  0,  0,  0,-30,-30],
          [-50,-30,-30,-30,-30,-30,-30,-50]
      ]
  };

  // Automatic generation of tables for black pieces by inverting the white tables
  function mirrorPST(whitePST) {
      const blackPST = {};
      for (const piece in whitePST) {
          blackPST[piece] = whitePST[piece].slice().reverse();
      }
      return blackPST;
  }

  const pst_opening_black = mirrorPST(pst_opening_white);
  const pst_endgame_black = mirrorPST(pst_endgame_white);

  // Final objects used by the evaluateBoard function
  const pst_opening = {
      'wP': pst_opening_white['P'], 'wN': pst_opening_white['N'], 'wB': pst_opening_white['B'], 'wR': pst_opening_white['R'], 'wQ': pst_opening_white['Q'], 'wK': pst_opening_white['K'],
      'bP': pst_opening_black['P'], 'bN': pst_opening_black['N'], 'bB': pst_opening_black['B'], 'bR': pst_opening_black['R'], 'bQ': pst_opening_black['Q'], 'bK': pst_opening_black['K']
  };

  const pst_endgame = {
      'wP': pst_endgame_white['P'], 'wN': pst_endgame_white['N'], 'wB': pst_endgame_white['B'], 'wR': pst_endgame_white['R'], 'wQ': pst_endgame_white['Q'], 'wK': pst_endgame_white['K'],
      'bP': pst_endgame_black['P'], 'bN': pst_endgame_black['N'], 'bB': pst_endgame_black['B'], 'bR': pst_endgame_black['R'], 'bQ': pst_endgame_black['Q'], 'bK': pst_endgame_black['K']
  };

    let boardState;
    let turn;
    let selectedPiece;
    let possibleMoves;
    let kingPositions;
    let castlingRights;
    let enPassantTarget;
    let isGameOver;
    let lastMove;
    let gameHistory;
    let historyIndex;
    let currentHint = null;
    let whiteTime, blackTime, increment, timerInterval;
    let positionHistory; // Map to track position repetitions

    function initGame() {
        boardState = [
            ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
            ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
            ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
        ];
        stopTimer();
        const selectedTimeControl = TIME_CONTROLS[timeControlSelect.value];
        whiteTime = selectedTimeControl.time;
        blackTime = selectedTimeControl.time;
        increment = selectedTimeControl.increment;
        updateClocksDisplay();

        // Reset position history
        positionHistory = new Map();
        const initialKey = generatePositionKey();
        positionHistory.set(initialKey, 1);
        
        turn = 'w';
        selectedPiece = null;
        possibleMoves = [];
        kingPositions = { 'w': [7, 4], 'b': [0, 4] };
        castlingRights = { 'w': { 'k': true, 'q': true }, 'b': { 'k': true, 'q': true } };
        enPassantTarget = null;
        isGameOver = false;
        lastMove = null;
        currentHint = null;
        moveHistoryElement.innerHTML = '';
        gameHistory = [];
        historyIndex = -1;
        saveState();
        renderBoard();
        updateStatus();
        if (timeControlSelect.value !== '99_0') {
            startTimer();
        }
    }
    
    function formatTime(ms) {
        if (ms >= 99 * 60 * 1000) return "∞"; // Infinity sign for unlimited mode
        const totalSeconds = Math.ceil(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function updateClocksDisplay() {
        whiteTimerElement.textContent = formatTime(whiteTime);
        blackTimerElement.textContent = formatTime(blackTime);

        whiteTimerElement.classList.toggle('active', turn === 'w' && !isGameOver);
        blackTimerElement.classList.toggle('active', turn === 'b' && !isGameOver);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    function startTimer() {
        if (isGameOver || timeControlSelect.value === '99_0') return;
        stopTimer(); // Make sure there are no duplicate timers
    
        const playerTime = turn === 'w' ? 'whiteTime' : 'blackTime';
    
        timerInterval = setInterval(() => {
            if (turn === 'w') {
                whiteTime -= 100;
            } else {
                blackTime -= 100;
            }

            if (whiteTime <= 0 || blackTime <= 0) {
                handleTimeout();
            }
            updateClocksDisplay();
        }, 100);
    }

    function handleTimeout() {
        stopTimer();
        isGameOver = true;
        const winner = turn === 'w' ? 'Black' : 'White';
        statusElement.textContent = `Time's up! ${winner} wins.`;
        updateClocksDisplay(); // Remove the backlight
    }

    function generatePositionKey() {
        // The key must take into account the positions of the pieces, the side of the move, the rights to castling and the purpose of the en passant capture.
        return JSON.stringify({
            board: boardState,
            turn: turn,
            castling: castlingRights,
            enPassant: enPassantTarget
        });
    }

    function checkForRepetitionDraw() {
        const key = generatePositionKey();
        const count = (positionHistory.get(key) || 0) + 1;
        positionHistory.set(key, count);

        if (count >= 3) {
            isGameOver = true;
            stopTimer();
            statusElement.textContent = "A draw by repeating the position three times.";
            return true;
        }
        return false;
    }
    function saveState() {
        const state = {
            boardState: JSON.parse(JSON.stringify(boardState)),
            turn: turn,
            kingPositions: JSON.parse(JSON.stringify(kingPositions)),
            castlingRights: JSON.parse(JSON.stringify(castlingRights)),
            enPassantTarget: enPassantTarget,
            isGameOver: isGameOver,
            lastMove: lastMove ? JSON.parse(JSON.stringify(lastMove)) : null,
            moveHistoryHTML: moveHistoryElement.innerHTML,
            positionHistory: new Map(positionHistory), // Save a copy of the map
            whiteTime: whiteTime,
            blackTime: blackTime
        };

        // If a move was made after undo, delete the "future" history
        if (historyIndex < gameHistory.length - 1) {
            gameHistory = gameHistory.slice(0, historyIndex + 1);
        }

        gameHistory.push(state);
        historyIndex++;
        updateUndoRedoButtons();
    }
    
    function loadState(state) {
        boardState = JSON.parse(JSON.stringify(state.boardState));
        turn = state.turn;
        kingPositions = JSON.parse(JSON.stringify(state.kingPositions));
        castlingRights = JSON.parse(JSON.stringify(state.castlingRights));
        enPassantTarget = state.enPassantTarget;
        isGameOver = state.isGameOver;
        lastMove = state.lastMove ? JSON.parse(JSON.stringify(state.lastMove)) : null;
        moveHistoryElement.innerHTML = state.moveHistoryHTML;
        positionHistory = new Map(state.positionHistory);
        whiteTime = state.whiteTime;
        blackTime = state.blackTime

        // Reset selection and possible moves
        selectedPiece = null;
        possibleMoves = [];
        currentHint = null;

        renderBoard();
        updateStatus();
        updateUndoRedoButtons();
        updateClocksDisplay();
    }
    
    function undoMove() {
        if (historyIndex > 0) {
            historyIndex--;
            loadState(gameHistory[historyIndex]);
        }
    }

    function redoMove() {
        if (historyIndex < gameHistory.length - 1) {
            historyIndex++;
            loadState(gameHistory[historyIndex]);
        }
    }
    
    function updateUndoRedoButtons() {
        undoButton.disabled = historyIndex <= 0;
        redoButton.disabled = historyIndex >= gameHistory.length - 1;
    }

    function renderBoard() {
        boardElement.innerHTML = '';
        let kingInCheckPos = null;
        if (isKingInCheck(turn)) {
            kingInCheckPos = kingPositions[turn];
        }

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const square = document.createElement('div');
                square.classList.add('square', (r + c) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = r;
                square.dataset.col = c;

                const piece = boardState[r][c];
                if (piece) {
                    const pieceElement = document.createElement('span');
                    pieceElement.classList.add('piece');
                    pieceElement.innerText = PIECES[piece];
                    pieceElement.id = `piece-${r}-${c}`;
                    square.appendChild(pieceElement);
                }

                if (selectedPiece && selectedPiece.row === r && selectedPiece.col === c) {
                    square.classList.add('selected');
                }

                if (possibleMoves.some(move => move.to[0] === r && move.to[1] === c)) {
                    square.classList.add('possible-move');
                }

                if (kingInCheckPos && kingInCheckPos[0] === r && kingInCheckPos[1] === c) {
                    square.classList.add('check');
                }
                
                if (lastMove && ((lastMove.from[0] === r && lastMove.from[1] === c) || (lastMove.to[0] === r && lastMove.to[1] === c))) {
                    square.classList.add('last-move');
                }
                
                if (currentHint && ((currentHint.from[0] === r && currentHint.from[1] === c) || (currentHint.to[0] === r && currentHint.to[1] === c))) {
                    square.classList.add('hint-move');
                }

                boardElement.appendChild(square);
            }
        }
    }
    
    function animateMove(move, onComplete) {
        const { from, to, isCastling, isEnPassant } = move;

        const fromSquare = document.querySelector(`.square[data-row="${from[0]}"][data-col="${from[1]}"]`);
        const toSquare = document.querySelector(`.square[data-row="${to[0]}"][data-col="${to[1]}"]`);
        const pieceElement = fromSquare ? fromSquare.querySelector('.piece') : null;

        if (!pieceElement || !fromSquare || !toSquare) {
            onComplete();
            return;
        }

        const animationPromises = [];

        // --- Main figure animation ---
        const mainAnimationPromise = new Promise(resolve => {
            const fromRect = fromSquare.getBoundingClientRect();
            const toRect = toSquare.getBoundingClientRect();
            const deltaX = toRect.left - fromRect.left;
            const deltaY = toRect.top - fromRect.top;

            pieceElement.classList.add('is-animating');
            pieceElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

            pieceElement.addEventListener('transitionend', resolve, { once: true });
        });
        animationPromises.push(mainAnimationPromise);

        // --- Animation for castling (additional piece) ---
        if (isCastling) {
            const rookFromCol = to[1] === 6 ? 7 : 0;
            const rookToCol = to[1] === 6 ? 5 : 3;
            const rookFromSquare = document.querySelector(`.square[data-row="${from[0]}"][data-col="${rookFromCol}"]`);
            const rookToSquare = document.querySelector(`.square[data-row="${from[0]}"][data-col="${rookToCol}"]`);
            const rookElement = rookFromSquare.querySelector('.piece');
            
            if (rookElement) {
                const rookAnimationPromise = new Promise(resolve => {
                    const fromRect = rookFromSquare.getBoundingClientRect();
                    const toRect = rookToSquare.getBoundingClientRect();
                    const deltaX = toRect.left - fromRect.left;
                    const deltaY = toRect.top - fromRect.top;
                    
                    rookElement.classList.add('is-animating');
                    rookElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                    rookElement.addEventListener('transitionend', resolve, { once: true });
                });
                animationPromises.push(rookAnimationPromise);
            }
        }

        Promise.all(animationPromises).then(() => {
            onComplete();
        });
    }

    function handleSquareClick(e) {
        if (isGameOver || turn === 'b') return; // The player cannot move as the AI.

        const square = e.target.closest('.square');
        if (!square) return;

        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        const piece = boardState[row][col];

        if (selectedPiece) {
            const move = possibleMoves.find(m => m.to[0] === row && m.to[1] === col);
            if (move) {
              makeMove(move);
            } else {
                selectedPiece = null;
                possibleMoves = [];
                currentHint = null;
                renderBoard();
            }
        } else if (piece && piece[0] === turn) {
            selectedPiece = { row, col, piece };
            possibleMoves = generateLegalMovesForPiece(row, col);
            renderBoard();
        }
    }

    function makeMove(move) {
        currentHint = null;
        // Stop the timer before making a move
        if (timeControlSelect.value !== '99_0') {
            stopTimer();
            if (turn === 'w') {
                whiteTime += increment;
            } else {
                blackTime += increment;
            }
            updateClocksDisplay();
        }
        const { from, to, promotion, isCastling, isEnPassant } = move;
        const piece = boardState[from[0]][from[1]];
        
        // History update
        addToMoveHistory(move);

        // Normal movement
        boardState[to[0]][to[1]] = piece;
        boardState[from[0]][from[1]] = null;
        
        lastMove = move;

        // Pawn promotion
        if (promotion) {
            boardState[to[0]][to[1]] = turn + promotion;
        }

        // Castling
        if (isCastling) {
            if (to[1] === 6) { // Kingside
                boardState[from[0]][5] = boardState[from[0]][7];
                boardState[from[0]][7] = null;
            } else { // Queenside
                boardState[from[0]][3] = boardState[from[0]][0];
                boardState[from[0]][0] = null;
            }
        }

        // En Passant
        if (isEnPassant) {
            boardState[from[0]][to[1]] = null;
        }

        // King position update
        if (piece[1] === 'K') {
            kingPositions[turn] = to;
        }

        // Updating castling rights
        if (piece === 'wK') {
            castlingRights.w.k = false;
            castlingRights.w.q = false;
        } else if (piece === 'bK') {
            castlingRights.b.k = false;
            castlingRights.b.q = false;
        } else if (piece === 'wR' && from[0] === 7 && from[1] === 0) {
            castlingRights.w.q = false;
        } else if (piece === 'wR' && from[0] === 7 && from[1] === 7) {
            castlingRights.w.k = false;
        } else if (piece === 'bR' && from[0] === 0 && from[1] === 0) {
            castlingRights.b.q = false;
        } else if (piece === 'bR' && from[0] === 0 && from[1] === 7) {
            castlingRights.b.k = false;
        }

        // Setting the target for En Passant
        if (piece[1] === 'P' && Math.abs(from[0] - to[0]) === 2) {
            enPassantTarget = [ (from[0] + to[0]) / 2, from[1] ];
        } else {
            enPassantTarget = null;
        };
        animateMove(move, () => {
            switchTurn();
        });
    }

    function switchTurn() {
        turn = (turn === 'w') ? 'b' : 'w';
        selectedPiece = null;
        possibleMoves = [];
        
        if (checkForRepetitionDraw()) {
            renderBoard();
            return;
        }
        
        saveState();
        renderBoard();
        updateStatus();
        
        if (!isGameOver) {
            // Start the timer for the next player
            if (timeControlSelect.value !== '99_0') {
                startTimer();
            }

            if (turn === 'b') {
                setTimeout(makeAiMove, 500);
            }
        } else {
            // Make sure the clock is stopped at the end of the game
            stopTimer();
            updateClocksDisplay();
        }
    }

    function updateStatus() {
        let statusText;
        const allLegalMoves = generateAllLegalMoves(turn);

        if (isKingInCheck(turn)) {
            if (allLegalMoves.length === 0) {
                statusText = `Checkmate! ${turn === 'w' ? 'Black' : 'White'} wins.`;
                isGameOver = true;
            } else {
                statusText = `Check! ${turn === 'w' ? 'White' : 'Black'} to move.`;
            }
        } else {
            if (allLegalMoves.length === 0) {
                statusText = "Pat! Remis.";
                isGameOver = true;
            } else {
                statusText = `${turn === 'w' ? 'White' : 'Black'} to move.`;
            }
        }
        if (isGameOver) {
            stopTimer();
            updateClocksDisplay();
        }
        statusElement.textContent = statusText;
    }

    function generateLegalMovesForPiece(r, c) {
        const pseudoLegalMoves = generatePseudoLegalMoves(r, c, boardState, enPassantTarget);
        const legalMoves = [];
        for (const move of pseudoLegalMoves) {
            if (!moveLeavesKingInCheck(move)) {
                legalMoves.push(move);
            }
        }
        return legalMoves;
    }

    function generateAllLegalMoves(player, currentBoardState = boardState, currentEnPassantTarget = enPassantTarget) {
        const allMoves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = currentBoardState[r][c];
                if (piece && piece[0] === player) {
                    const pseudoLegalMoves = generatePseudoLegalMoves(r, c, currentBoardState, currentEnPassantTarget);
                    for (const move of pseudoLegalMoves) {
                        if (!moveLeavesKingInCheck(move, player, currentBoardState)) {
                            allMoves.push(move);
                        }
                    }
                }
            }
        }
        return allMoves;
    }

    function generatePseudoLegalMoves(r, c, currentBoardState, currentEnPassantTarget) {
        const piece = currentBoardState[r][c];
        if (!piece) return [];
        const moves = [];
        const color = piece[0];
        const type = piece[1];

        const addMove = (toR, toC) => {
            if (toR >= 0 && toR < 8 && toC >= 0 && toC < 8) {
                const targetPiece = currentBoardState[toR][toC];
                if (targetPiece === null) {
                    moves.push({ from: [r, c], to: [toR, toC] });
                    return true; // Can continue sliding
                } else if (targetPiece[0] !== color) {
                    moves.push({ from: [r, c], to: [toR, toC] });
                    return false; // Cannot continue sliding
                }
            }
            return false;
        };

        switch (type) {
            case 'P':
                const dir = color === 'w' ? -1 : 1;
                const startRow = color === 'w' ? 6 : 1;
                const promotionRow = color === 'w' ? 0 : 7;

                // Normal move
                if (currentBoardState[r + dir][c] === null) {
                    if (r + dir === promotionRow) {
                        ['Q', 'R', 'B', 'N'].forEach(p => moves.push({ from: [r, c], to: [r + dir, c], promotion: p }));
                    } else {
                        moves.push({ from: [r, c], to: [r + dir, c] });
                    }
                    // Double move
                    if (r === startRow && currentBoardState[r + 2 * dir][c] === null) {
                        moves.push({ from: [r, c], to: [r + 2 * dir, c] });
                    }
                }
                // Captures
                [-1, 1].forEach(dCol => {
                    if (c + dCol >= 0 && c + dCol < 8) {
                        const target = currentBoardState[r + dir][c + dCol];
                        if (target && target[0] !== color) {
                            if (r + dir === promotionRow) {
                                ['Q', 'R', 'B', 'N'].forEach(p => moves.push({ from: [r, c], to: [r + dir, c + dCol], promotion: p }));
                            } else {
                                moves.push({ from: [r, c], to: [r + dir, c + dCol] });
                            }
                        }
                        // En passant
                        if (currentEnPassantTarget && currentEnPassantTarget[0] === r + dir && currentEnPassantTarget[1] === c + dCol) {
                            moves.push({ from: [r, c], to: [r + dir, c + dCol], isEnPassant: true });
                        }
                    }
                });
                break;

            case 'N':
                const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
                knightMoves.forEach(([dr, dc]) => addMove(r + dr, c + dc));
                break;

            case 'B':
            case 'R':
            case 'Q':
                const directions = {
                    'B': [[-1, -1], [-1, 1], [1, -1], [1, 1]],
                    'R': [[-1, 0], [1, 0], [0, -1], [0, 1]],
                    'Q': [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]
                }[type];
                directions.forEach(([dr, dc]) => {
                    let curR = r + dr, curC = c + dc;
                    while (addMove(curR, curC)) {
                        curR += dr;
                        curC += dc;
                    }
                });
                break;

            case 'K':
                const kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
                kingMoves.forEach(([dr, dc]) => addMove(r + dr, c + dc));
                // Castling
                if (castlingRights[color] && castlingRights[color].k &&
                    currentBoardState[r][c+1] === null && currentBoardState[r][c+2] === null &&
                    !isSquareAttacked(r, c, color === 'w' ? 'b' : 'w', currentBoardState) &&
                    !isSquareAttacked(r, c+1, color === 'w' ? 'b' : 'w', currentBoardState) &&
                    !isSquareAttacked(r, c+2, color === 'w' ? 'b' : 'w', currentBoardState)) {
                    moves.push({ from: [r, c], to: [r, c + 2], isCastling: true });
                }
                if (castlingRights[color] && castlingRights[color].q &&
                    currentBoardState[r][c-1] === null && currentBoardState[r][c-2] === null && currentBoardState[r][c-3] === null &&
                    !isSquareAttacked(r, c, color === 'w' ? 'b' : 'w', currentBoardState) &&
                    !isSquareAttacked(r, c-1, color === 'w' ? 'b' : 'w', currentBoardState) &&
                    !isSquareAttacked(r, c-2, color === 'w' ? 'b' : 'w', currentBoardState)) {
                    moves.push({ from: [r, c], to: [r, c - 2], isCastling: true });
                }
                break;
        }
        return moves;
    }

    function isSquareAttacked(r, c, byPlayer, currentBoardState) {
        // Check for pawn attacks
        const pawnDir = byPlayer === 'w' ? 1 : -1;
        if (r + pawnDir >= 0 && r + pawnDir < 8) {
            if (c > 0 && currentBoardState[r + pawnDir][c - 1] === byPlayer + 'P') return true;
            if (c < 7 && currentBoardState[r + pawnDir][c + 1] === byPlayer + 'P') return true;
        }

        // Check for knight attacks
        const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        for (const [dr, dc] of knightMoves) {
            const newR = r + dr, newC = c + dc;
            if (newR >= 0 && newR < 8 && newC >= 0 && newC < 8 && currentBoardState[newR][newC] === byPlayer + 'N') return true;
        }

        // Check for sliding pieces (Rook, Bishop, Queen)
        const slidingDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of slidingDirections) {
            for (let i = 1; i < 8; i++) {
                const newR = r + i * dr, newC = c + i * dc;
                if (newR < 0 || newR >= 8 || newC < 0 || newC >= 8) break;
                const piece = currentBoardState[newR][newC];
                if (piece) {
                    if (piece[0] === byPlayer) {
                        const type = piece[1];
                        const isDiagonal = dr !== 0 && dc !== 0;
                        if (type === 'Q' || (isDiagonal && type === 'B') || (!isDiagonal && type === 'R')) {
                            return true;
                        }
                    }
                    break;
                }
            }
        }

        // Check for king attacks
        const kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        for (const [dr, dc] of kingMoves) {
            const newR = r + dr, newC = c + dc;
            if (newR >= 0 && newR < 8 && newC >= 0 && newC < 8 && currentBoardState[newR][newC] === byPlayer + 'K') return true;
        }

        return false;
    }

    function isKingInCheck(kingColor, currentBoardState = boardState) {
        const kingPos = findKing(kingColor, currentBoardState);
        if (!kingPos) return false; // Should not happen in a normal game
        return isSquareAttacked(kingPos[0], kingPos[1], kingColor === 'w' ? 'b' : 'w', currentBoardState);
    }

    function findKing(color, currentBoardState) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (currentBoardState[r][c] === color + 'K') {
                    return [r, c];
                }
            }
        }
        return null;
    }

    function moveLeavesKingInCheck(move, player = turn, currentBoardState = boardState) {
        // Create a temporary board to simulate the move
        const tempBoard = currentBoardState.map(row => row.slice());
        const { from, to, isCastling, isEnPassant, promotion } = move;
        const piece = tempBoard[from[0]][from[1]];

        tempBoard[to[0]][to[1]] = promotion ? player + promotion : piece;
        tempBoard[from[0]][from[1]] = null;

        if (isEnPassant) {
            tempBoard[from[0]][to[1]] = null;
        }
        if (isCastling) {
            if (to[1] === 6) { // Kingside
                tempBoard[from[0]][5] = tempBoard[from[0]][7];
                tempBoard[from[0]][7] = null;
            } else { // Queenside
                tempBoard[from[0]][3] = tempBoard[from[0]][0];
                tempBoard[from[0]][0] = null;
            }
        }
        
        return isKingInCheck(player, tempBoard);
    }
    
    function addToMoveHistory(move) {
        const { from, to, promotion } = move;
        const piece = boardState[from[0]][from[1]];
        const pieceSymbol = PIECES[piece];
        const fromNotation = String.fromCharCode(97 + from[1]) + (8 - from[0]);
        const toNotation = String.fromCharCode(97 + to[1]) + (8 - to[0]);
        const moveText = `${pieceSymbol} ${fromNotation} → ${toNotation}${promotion ? `=${PIECES[turn+promotion]}` : ''}`;
        
        const li = document.createElement('li');
        li.textContent = moveText;
        moveHistoryElement.appendChild(li);
        moveHistoryElement.scrollTop = moveHistoryElement.scrollHeight;
    }

    // --- AI LOGIC (Alpha-Beta Pruning) ---

    function makeAiMove() {
        const bestMove = findBestMove(parseInt(difficultySelect.value)); // Głębokość 5
        if (bestMove) {
            makeMove(bestMove);
        }
    }
    
    function findBestMove(depth) {
        // Instead of having one best move, we keep a list of moves with the same best value.
        let bestMoves = []; 
        let bestValue = -Infinity;
        const moves = generateAllLegalMoves('b');
        
        // If there are no moves, return null (game over)
        if (moves.length === 0) {
            return null;
        }

        // Sorting moves for better alpha-beta performance (captures first)
        moves.sort((a, b) => {
            const aIsCapture = boardState[a.to[0]][a.to[1]] !== null;
            const bIsCapture = boardState[b.to[0]][b.to[1]] !== null;
            return bIsCapture - aIsCapture;
        });

        for (const move of moves) {
            const tempState = applyMoveToTempState(boardState, move, 'b');
            const boardValue = minimax(tempState.board, depth - 1, -Infinity, Infinity, false, tempState.enPassant);
            
            // If traffic with BETTER value is found, reset the list and add that traffic.
            if (boardValue > bestValue) {
                bestValue = boardValue;
                bestMoves = [move]; // Create a new list with this one best move
            } 
            // If you find traffic with the SAME value as the best, add it to the lists.
            else if (boardValue === bestValue) {
                bestMoves.push(move);
            }
        }

        // If the best move list is not empty, return a RANDOM move from that list.
        // This prevents repeating the same moves in situations where multiple options are equally good.
        if (bestMoves.length > 0) {
            return bestMoves[Math.floor(Math.random() * bestMoves.length)];
        }
        
        // Emergency (very unlikely but safe) - return any legal traffic.
        return moves[0];
    }

    function minimax(currentBoard, depth, alpha, beta, isMaximizingPlayer, currentEnPassantTarget) {
        if (depth === 0) {
            return evaluateBoard(currentBoard, generateAllLegalMoves('w', currentBoard, currentEnPassantTarget).length, generateAllLegalMoves('b', currentBoard, currentEnPassantTarget).length);
        }

        const player = isMaximizingPlayer ? 'b' : 'w'; // AI (black) is maximizing
        const moves = generateAllLegalMoves(player, currentBoard, currentEnPassantTarget);

        if (moves.length === 0) {
            if (isKingInCheck(player, currentBoard)) {
                return isMaximizingPlayer ? -1000000 : 1000000; // Checkmate
            }
            return 0; // Stalemate
        }

        if (isMaximizingPlayer) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const tempState = applyMoveToTempState(currentBoard, move, player);
                const evaluation = minimax(tempState.board, depth - 1, alpha, beta, false, tempState.enPassant);
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) {
                    break; // Beta cutoff
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const tempState = applyMoveToTempState(currentBoard, move, player);
                const evaluation = minimax(tempState.board, depth - 1, alpha, beta, true, tempState.enPassant);
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) {
                    break; // Alpha cutoff
                }
            }
            return minEval;
        }
    }
    
    function evaluateBoard(currentBoard, whiteMobility, blackMobility) {
        // --- Bonus definitions ---
        const MOBILITY_WEIGHT = 2;
        const BISHOP_PAIR_BONUS = 50;
        const ROOK_ON_OPEN_FILE_BONUS = 25;
        const ROOK_ON_SEMI_OPEN_FILE_BONUS = 15;
        // The free pawn bonus values are indexed for both suits.
        const PASSED_PAWN_BONUS_WHITE = [0, 10, 20, 40, 60, 100, 150, 0]; // index 7 is the starting line, 0 is the promotion
        const PASSED_PAWN_BONUS_BLACK = [0, 150, 100, 60, 40, 20, 10, 0]; // index 0 is the starting line, 7 is the promotion

        let whiteScore = 0;
        let blackScore = 0;
        let whiteBishops = 0;
        let blackBishops = 0;
        let nonPawnKingMaterial = 0; // Material counter to determine game phase

        const whitePawnCols = new Set();
        const blackPawnCols = new Set();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = currentBoard[r][c];
                if (piece) {
                    const type = piece[1];
                    if (type === 'P') {
                        if (piece[0] === 'w') {
                            whitePawnCols.add(c);
                        } else {
                            blackPawnCols.add(c);
                        }
                    } 
                    // We count the material of the pieces (without pawns and kings) to determine the phase of the game
                    else if (type !== 'K') {
                       nonPawnKingMaterial += pieceValues[type];
                    }
                }
            }
        }

        const ENDGAME_MATERIAL_THRESHOLD = 4000; // Threshold for experiments (e.g. 2 rooks + knight + bishop)
        const pst = nonPawnKingMaterial < ENDGAME_MATERIAL_THRESHOLD ? pst_endgame : pst_opening;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = currentBoard[r][c];
                if (!piece) continue;

                const color = piece[0];
                const type = piece[1];
                const value = pieceValues[type] + pst[piece][r][c];

                if (color === 'w') {
                    whiteScore += value;
                } else {
                    blackScore += value;
                }

                // In the same loop we perform figure-specific evaluations
                switch (type) {
                    case 'B':
                        // Counting bishops for later pair bonus
                        if (color === 'w') whiteBishops++;
                        else blackBishops++;
                        break;

                    case 'R':
                        // Tower Bonus on open/semi-open lines (uses pre-scan)
                        if (!whitePawnCols.has(c) && !blackPawnCols.has(c)) {
                            if (color === 'w') whiteScore += ROOK_ON_OPEN_FILE_BONUS;
                            else blackScore += ROOK_ON_OPEN_FILE_BONUS;
                        } else if (color === 'w' && !whitePawnCols.has(c)) {
                            whiteScore += ROOK_ON_SEMI_OPEN_FILE_BONUS;
                        } else if (color === 'b' && !blackPawnCols.has(c)) {
                            blackScore += ROOK_ON_SEMI_OPEN_FILE_BONUS;
                        }
                        break;
                        
                    case 'P':
                        // Bonus for free pieces
                        let isPassed = true;
                        if (color === 'w') {
                            // Check if there are no black pieces in front of the white pawn in this or adjacent columns
                            for (let checkRow = r - 1; checkRow >= 0; checkRow--) {
                                if ( (blackPawnCols.has(c)) ||
                                     (c > 0 && blackPawnCols.has(c - 1)) ||
                                     (c < 7 && blackPawnCols.has(c + 1)) ) {
                                     if ( (currentBoard[checkRow][c] === 'bP') ||
                                          (c > 0 && currentBoard[checkRow][c - 1] === 'bP') ||
                                          (c < 7 && currentBoard[checkRow][c + 1] === 'bP') ) {
                                        isPassed = false;
                                        break;
                                    }
                                }
                            }
                            if (isPassed) {
                                whiteScore += PASSED_PAWN_BONUS_WHITE[r];
                            }
                        } else { // Black piece
                             // Check if there are no white pieces in front of the black piece
                            for (let checkRow = r + 1; checkRow < 8; checkRow++) {
                                if ( (whitePawnCols.has(c)) ||
                                     (c > 0 && whitePawnCols.has(c - 1)) ||
                                     (c < 7 && whitePawnCols.has(c + 1)) ) {
                                     
                                    if ( (currentBoard[checkRow][c] === 'wP') ||
                                         (c > 0 && currentBoard[checkRow][c - 1] === 'wP') ||
                                         (c < 7 && currentBoard[checkRow][c + 1] === 'wP') ) {
                                        isPassed = false;
                                        break;
                                    }
                                }
                            }
                            if (isPassed) {
                               blackScore += PASSED_PAWN_BONUS_BLACK[r];
                            }
                        }
                        break;
                }
            }
        }
        
        // --- Final calculations  ---

        // Bishop Pair Bonus
        if (whiteBishops >= 2) whiteScore += BISHOP_PAIR_BONUS;
        if (blackBishops >= 2) blackScore += BISHOP_PAIR_BONUS;
        
        // Mobility Bonus
        const mobilityScore = (blackMobility - whiteMobility) * MOBILITY_WEIGHT;

        // The final score is the difference in points (from Black's perspective, which maximizes the score)
        return (blackScore - whiteScore) + mobilityScore;
    }
    
    function applyMoveToTempState(currentBoard, move, player) {
        const tempBoard = currentBoard.map(row => row.slice());
        const { from, to, promotion, isCastling, isEnPassant } = move;
        const piece = tempBoard[from[0]][from[1]];

        tempBoard[to[0]][to[1]] = promotion ? player + promotion : piece;
        tempBoard[from[0]][from[1]] = null;

        if (isEnPassant) {
            tempBoard[from[0]][to[1]] = null;
        }
        if (isCastling) {
            if (to[1] === 6) {
                tempBoard[from[0]][5] = tempBoard[from[0]][7];
                tempBoard[from[0]][7] = null;
            } else {
                tempBoard[from[0]][3] = tempBoard[from[0]][0];
                tempBoard[from[0]][0] = null;
            }
        }
        
        let newEnPassantTarget = null;
        if (piece[1] === 'P' && Math.abs(from[0] - to[0]) === 2) {
            newEnPassantTarget = [ (from[0] + to[0]) / 2, from[1] ];
        }

        return { board: tempBoard, enPassant: newEnPassantTarget };
    }
    
    function showHint() {
        // The hint only works for the player (white) and when the game is not over
        if (isGameOver || turn !== 'w') {
            return;
        }

        hintButton.disabled = true;
        statusElement.textContent = "I'm thinking about a suggestion...";
        currentHint = null;
        renderBoard();      // Refresh the view to make the old tooltip disappear

        setTimeout(() => {
            const depth = 4; // Depth 4
            const bestMove = findBestMoveForHinter(turn, depth);

            if (bestMove) {
                currentHint = bestMove;
                renderBoard(); // Show new hint on the chessboard
            }

            updateStatus();
            hintButton.disabled = false;
        }, 50);
    }

    function findBestMoveForHinter(player, depth) {
        let bestMoves = [];
        let bestValue;

        const isMaximizingForThisTurn = (player === 'b');
        bestValue = isMaximizingForThisTurn ? -Infinity : Infinity;

        const moves = generateAllLegalMoves(player);
        if (moves.length === 0) return null;

        // Sorting moves (capturing first) improves Alpha-Beta performance
        moves.sort((a, b) => (boardState[b.to[0]][b.to[1]] !== null) - (boardState[a.to[0]][a.to[1]] !== null));

        for (const move of moves) {
            const tempState = applyMoveToTempState(boardState, move, player);
            // The next move will be made by the opponent, so we invert the `isMaximizing` flag.
            const boardValue = minimax(tempState.board, depth - 1, -Infinity, Infinity, !isMaximizingForThisTurn, tempState.enPassant);

            if (isMaximizingForThisTurn) { // Logic for Black (Maximization)
                if (boardValue > bestValue) {
                    bestValue = boardValue;
                    bestMoves = [move];
                } else if (boardValue === bestValue) {
                    bestMoves.push(move);
                }
            } else { // Logic for White (Minimization)
                if (boardValue < bestValue) {
                    bestValue = boardValue;
                    bestMoves = [move];
                } else if (boardValue === bestValue) {
                    bestMoves.push(move);
                }
            }
        }
        
        // Return a random move from the best ones
        if (bestMoves.length > 0) {
            return bestMoves[Math.floor(Math.random() * bestMoves.length)];
        }
        
        return moves[0];
    }

    // Event listening
    boardElement.addEventListener('click', handleSquareClick);
    newGameButton.addEventListener('click', initGame);
    undoButton.addEventListener('click', undoMove);
    redoButton.addEventListener('click', redoMove);
    hintButton.addEventListener('click', showHint);
    timeControlSelect.addEventListener('change', initGame);

    // Initiate game
    initGame();
});
