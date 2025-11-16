// tic-tac-toe-client.js
// Full client code with username propagation fixes

// Game state
const gameState = {
  board: Array(9).fill(""),
  currentPlayer: "X",
  mySymbol: "",
  opponent: { id: "", username: "" },
  isGameOver: false,
  winningLine: [],
  myTurn: false,
  matchId: null,
  session: null,
  winner: null,
  gameMode: 'classic', // 'classic' or 'timed'
  timers: null, // { perMoveMs: 30000, remaining: { player1: 30000, player2: 30000 } }
  leaderboard: [],
  rematchRequested: []
};

let socket; // module-level socket variable

// DOM Elements
let statusEl, boardEl, usernameEl, findMatchBtn, timerEl, modeSelectEl;

// Initialize the game
async function init() {
  console.log("🎮 Initializing game...");

  // Initialize UI elements
  statusEl = document.getElementById('status');
  boardEl = document.getElementById('game-board');
  usernameEl = document.getElementById('username');
  findMatchBtn = document.getElementById('find-match-btn');
  timerEl = document.getElementById('timer');
  modeSelectEl = document.getElementById('game-mode');

  // Set up event listeners
  findMatchBtn.addEventListener('click', findMatch);
  document.getElementById('login-btn').addEventListener('click', setUsername);
  
  // Add logout button handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('username');
      localStorage.removeItem('deviceId');
      if (socket) {
        socket.disconnect();
      }
      resetGame();
      const overlay = document.getElementById('nickname-overlay');
      if (overlay) {
        overlay.classList.add('show');
        overlay.style.display = 'flex';
      }
      const gameSection = document.getElementById('game-section');
      if (gameSection) {
        gameSection.classList.add('hidden');
      }
      updateStatus('Logged out. Please enter your username.');
    });
  }
  
  // Add bot mode handler
  const botBtn = document.getElementById('play-bot-btn');
  if (botBtn) {
    botBtn.addEventListener('click', () => {
      if (!setUsername()) {
        alert('Please enter a valid username');
        return;
      }
      startBotGame();
    });
  }

  // Load saved username
  const savedUsername = localStorage.getItem('username');
  if (savedUsername) {
    usernameEl.value = savedUsername;
  }

  updateStatus("Set your username and click 'Find Match' to start");
  renderBoard();
  
  // Load leaderboard
  loadLeaderboard();
  updateLeaderboardDisplay();
  
  // Add rematch button handler
  const rematchBtn = document.getElementById('request-rematch-btn');
  if (rematchBtn) {
    rematchBtn.addEventListener('click', requestRematch);
  }
  
  // Add "Find New Match" button handler
  const newMatchBtn = document.getElementById('result-play-again');
  if (newMatchBtn) {
    newMatchBtn.addEventListener('click', () => {
      hideResult();
      resetGame();
      findMatch();
    });
  }
}

// Set username
function setUsername() {
  const newUsername = usernameEl.value.trim();
  if (newUsername) {
    localStorage.setItem('username', newUsername);
    updateStatus(`Username set to: ${newUsername}`);
    
    // Hide the nickname overlay
    const overlay = document.getElementById('nickname-overlay');
    if (overlay) {
      overlay.classList.remove('show');
      overlay.style.display = 'none';
    }
    
    // Show the game section
    const gameSection = document.getElementById('game-section');
    if (gameSection) {
      gameSection.classList.remove('hidden');
    }
    
    return true;
  }
  return false;
}

// Find a match
async function findMatch() {
  if (!setUsername()) {
    alert("Please enter a valid username");
    return;
  }

  try {
    findMatchBtn.disabled = true;
    
    // Get selected game mode
    const selectedMode = modeSelectEl ? modeSelectEl.value : 'classic';
    gameState.gameMode = selectedMode;
    
    updateStatus(`Finding ${selectedMode} match...`);

    // Initialize Nakama client
    const client = new nakamajs.Client("defaultkey", "localhost", 7350, false);

    // Authenticate with device id (don't pass username to avoid conflicts)
    // Use a unique device ID per session
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const deviceId = `web_${timestamp}_${random}`;
    localStorage.setItem('deviceId', deviceId);

    // Authenticate without username to avoid 409 conflicts
    const session = await client.authenticateDevice(deviceId, true);
    gameState.session = session;

    // Connect socket
    socket = client.createSocket();
    await socket.connect(session, true);

    // Set up socket handlers
    const setupSocketHandlers = () => {
      socket.ondisconnect = async (evt) => {
        console.error("Socket disconnected:", evt);
        updateStatus("Disconnected from server");
        
        // Try to reconnect if token expired
        if (evt.code === 1005 || evt.reason.includes('expired')) {
          console.log("Attempting to refresh session and reconnect...");
          try {
            // Re-authenticate to get a fresh session
            const deviceId = localStorage.getItem('deviceId');
            const session = await client.authenticateDevice(deviceId, true);
            gameState.session = session;
            
            // Create new socket and connect
            socket = client.createSocket();
            await socket.connect(session, true);
            
            // Re-setup handlers
            setupSocketHandlers();
            
            updateStatus("Reconnected to server");
          } catch (error) {
            console.error("Failed to reconnect:", error);
            updateStatus("Please refresh the page to reconnect");
          }
        }
      };
      socket.onmatchdata = handleMatchData;
      socket.onmatchmakermatched = handleMatchFound;
    };
    
    setupSocketHandlers();
    
    // Set up periodic token refresh (every 30 minutes)
    const refreshTokenInterval = setInterval(async () => {
      try {
        if (gameState.session && socket && socket.connected) {
          const deviceId = localStorage.getItem('deviceId');
          const session = await client.authenticateDevice(deviceId, true);
          gameState.session = session;
          console.log("Token refreshed successfully");
        }
      } catch (error) {
        console.error("Failed to refresh token:", error);
      }
    }, 30 * 60 * 1000); // 30 minutes
    
    // Clear interval on disconnect
    const originalOnDisconnect = socket.ondisconnect;
    socket.ondisconnect = (evt) => {
      clearInterval(refreshTokenInterval);
      originalOnDisconnect(evt);
    };
    
    // Start matchmaking and attach username in the matchmaker ticket properties
    // NOTE: We pass the properties object directly to addMatchmaker
    // This will allow the server/match init and matched payload to include the username.
    const myUsername = usernameEl.value.trim();
    const properties = { username: myUsername };

    // Use the same query string "*" if your matchmaker is simple. We put username in the 4th arg.
    const ticket = await socket.addMatchmaker("*", 2, 2, properties);

    updateStatus("Looking for opponent...");
  } catch (error) {
    console.error("Error finding match:", error);
    updateStatus("Error finding match. Please try again.");
    findMatchBtn.disabled = false;
  }
}

// Robust helper: extract username for a user entry from possible places
function extractUsernameFromMatched(matched, userEntry) {
  // 1) presence.username (common)
  if (userEntry && userEntry.presence && userEntry.presence.username) {
    return userEntry.presence.username;
  }

  // 2) userEntry.vars (some flows put ticket properties into vars)
  if (userEntry && userEntry.vars && userEntry.vars.username) {
    return userEntry.vars.username;
  }

  // 3) matched.properties (the whole matched object may have a properties object)
  if (matched && matched.properties) {
    try {
      const p = typeof matched.properties === "string" ? JSON.parse(matched.properties) : matched.properties;
      if (p && p.username) return p.username;
    } catch (e) { /* ignore parse error */ }
  }

  // 4) matched.ticket.payload (some Nakama runtimes put the ticket payload here)
  if (matched && matched.ticket && matched.ticket.payload) {
    try {
      const payload = typeof matched.ticket.payload === "string" ? JSON.parse(matched.ticket.payload) : matched.ticket.payload;
      if (payload && payload.username) return payload.username;
    } catch (e) { /* ignore parse error */ }
  }

  // 5) If userEntry has a 'username' field directly (less common)
  if (userEntry && userEntry.username) {
    return userEntry.username;
  }

  return null;
}

// Handle match found
async function handleMatchFound(matched) {
  console.log("🎮 Match found payload:", matched);

  try {
    const myUserId = gameState.session ? gameState.session.user_id : null;

    // matched.users is an array of user entries; pick the other player
    const otherUserEntry = matched.users && matched.users.find(u => {
      const uid = (u.presence && u.presence.user_id) || u.user_id || null;
      return uid !== myUserId;
    });

    const selfEntry = matched.self || null;

    // Extract opponent information
    const opponentId = otherUserEntry && ((otherUserEntry.presence && otherUserEntry.presence.user_id) || otherUserEntry.user_id);
    const opponentUsername = extractUsernameFromMatched(matched, otherUserEntry) || "";

    // Extract our username - prioritize the input field value
    const myUsername = usernameEl.value.trim() ||
                      extractUsernameFromMatched(matched, selfEntry) ||
                      (gameState.session && gameState.session.username) ||
                      localStorage.getItem('username') ||
                      "";

    // Determine if I'm X or O
    const firstPlayerId = matched.users && matched.users[0] && 
                         ((matched.users[0].presence && matched.users[0].presence.user_id) || matched.users[0].user_id);
    const isFirstPlayer = (selfEntry && ((selfEntry.presence && selfEntry.presence.user_id) || selfEntry.user_id) === firstPlayerId);
    
    // Update game state
    gameState.mySymbol = isFirstPlayer ? 'X' : 'O';
    gameState.myUsername = myUsername;
    gameState.opponent = {
      id: opponentId || "",
      username: opponentUsername,
      symbol: isFirstPlayer ? 'O' : 'X'
    };

    // Initialize game state
    gameState.currentPlayer = 'X'; // X always goes first
    gameState.myTurn = (gameState.mySymbol === 'X');
    gameState.matchId = matched.match_id;
    gameState.board = Array(9).fill("");
    gameState.isGameOver = false;
    gameState.winner = null;
    gameState.winningLine = [];
    gameState.rematchRequested = [];
    
    // Initialize timers for timed mode
    if (gameState.gameMode === 'timed' && opponentId) {
      const perMoveMs = 30000; // 30 seconds per move
      gameState.timers = {
        perMoveMs,
        remaining: {
          [gameState.session.user_id]: perMoveMs,
          [opponentId]: perMoveMs
        }
      };
      
      // Start timer if it's my turn
      if (gameState.myTurn) {
        startTimer();
      }
    }

    // Update UI
    updatePlayerInfo();
    updateStatus(gameState.myTurn ? "Your turn (X)" : `Waiting for ${opponentUsername}...`);
    renderBoard();
    
    // Show the game board
    const boardWrap = document.getElementById('board-wrap');
    if (boardWrap) {
      boardWrap.classList.remove('hidden');
    }

    // Join the match on the socket
    if (socket && socket.joinMatch) {
      await socket.joinMatch(matched.match_id);
    }

    // Update UI
    renderBoard();
  } catch (err) {
    console.error("Error in handleMatchFound:", err, matched);
  }
}

// Handle generic match data (updated to handle server's message format)
function handleMatchData(matchData) {
  console.log("📦 Match data received:", matchData);

  try {
    let raw = matchData.data;
    let decoded;
    
    // First try to decode base64 and parse JSON
    try {
      // If it's a string, try to decode it as base64
      if (typeof raw === 'string') {
        // Remove any padding characters that might cause issues
        const base64 = raw.replace(/[^A-Za-z0-9+/=]/g, '');
        const jsonString = atob(base64);
        decoded = JSON.parse(jsonString);
      } else {
        // If not a string, try to use it directly
        decoded = raw;
      }
    } catch (e) {
      console.error("Failed to parse match data:", e);
      return;
    }
    
    console.log("📦 Decoded match data:", decoded);

    console.log("📦 Decoded match data:", decoded);

    // Handle different message types from server
    if (decoded.type === 'match_start') {
      console.log("🚀 Match start data:", decoded);
      
      // Set initial game state
      gameState.board = decoded.board || Array(9).fill("");
      gameState.currentPlayer = decoded.current_player || 'X';
      gameState.isGameOver = false;
      gameState.winner = null;
      gameState.winningLine = [];
      
      // Handle player information
      if (decoded.players && Array.isArray(decoded.players)) {
        const currentPlayer = decoded.players.find(p => p.user_id === gameState.session.user_id);
        const opponent = decoded.players.find(p => p.user_id !== gameState.session.user_id);
        
        if (currentPlayer) {
          gameState.mySymbol = currentPlayer.symbol;
          gameState.myUsername = currentPlayer.username || gameState.session?.username || '';
        }
        
        if (opponent) {
          gameState.opponent = {
            id: opponent.user_id,
            username: opponent.username || '',
            symbol: opponent.symbol
          };
        }
      }
      
      // Also check for direct player info in the message
      if (decoded.player_x_id && decoded.player_o_id) {
        const isPlayerX = gameState.session.user_id === decoded.player_x_id;
        gameState.mySymbol = isPlayerX ? 'X' : 'O';
        
        if (!gameState.opponent) {
          gameState.opponent = {
            id: isPlayerX ? decoded.player_o_id : decoded.player_x_id,
            username: isPlayerX ? (decoded.player_o_username || '') : (decoded.player_x_username || ''),
            symbol: isPlayerX ? 'O' : 'X'
          };
        }
      }
      
      gameState.myTurn = (gameState.currentPlayer === gameState.mySymbol);
      
      console.log("👤 Current player:", {
        id: gameState.session.user_id,
        symbol: gameState.mySymbol,
        username: gameState.myUsername
      });
      console.log("👥 Opponent:", gameState.opponent);
      
    } else if (decoded.type === 'game_state') {
      console.log("🔄 Game state update:", decoded);
      
      // Update board state
      if (decoded.state.board && Array.isArray(decoded.state.board)) {
        gameState.board = decoded.state.board;
      }
      
      // Update current player
      if (decoded.state.current_player) {
        gameState.currentPlayer = decoded.state.current_player;
        gameState.myTurn = (gameState.currentPlayer === gameState.mySymbol);
      }
      
      // Update game over status
      if (decoded.state.game_over !== undefined) {
        gameState.isGameOver = decoded.state.game_over;
        gameState.winner = decoded.state.winner;
        gameState.winningLine = decoded.state.winning_line || [];
        
        if (gameState.isGameOver) {
          stopTimer();
          showResult(gameState.winner);
        }
      }
      
      // Update player information
      const players = (decoded.state.players && Array.isArray(decoded.state.players)) ? decoded.state.players : [];
      const currentPlayer = players.find(p => p.user_id === gameState.session.user_id) || {};
      const opponent = players.find(p => p.user_id !== gameState.session.user_id) || {};
      
      // Update current player info
      if (currentPlayer && currentPlayer.user_id) {
        gameState.mySymbol = currentPlayer.symbol || gameState.mySymbol;
        gameState.myUsername = currentPlayer.username || gameState.myUsername || gameState.session?.username || '';
      }
      
      // Update opponent info - prioritize data from the state object first
      if (decoded.state.player_x_id && decoded.state.player_o_id) {
        const isPlayerX = gameState.session.user_id === decoded.state.player_x_id;
        const opponentId = isPlayerX ? decoded.state.player_o_id : decoded.state.player_x_id;
        let opponentUsername = isPlayerX ? (decoded.state.player_o_username || '') : (decoded.state.player_x_username || '');
        
        // If we have opponent data from players array, use that instead
        if (opponent && opponent.user_id === opponentId && opponent.username) {
          opponentUsername = opponent.username;
        }
        
        gameState.opponent = {
          id: opponentId,
          username: opponentUsername,
          symbol: isPlayerX ? 'O' : 'X'
        };
        
        // Make sure our symbol is set correctly
        gameState.mySymbol = isPlayerX ? 'X' : 'O';
      }
      
      // Update game state
      gameState.board = decoded.state.board || gameState.board;
      gameState.currentPlayer = decoded.state.current_player || gameState.currentPlayer;
      gameState.isGameOver = decoded.state.game_over || false;
      gameState.winner = decoded.state.winner || null;
      gameState.winningLine = decoded.state.winning_line || [];
      gameState.myTurn = (gameState.currentPlayer === gameState.mySymbol);
      
      // Update UI
      updatePlayerInfo();
      updateStatus(gameState.myTurn ? "Your turn" : "Opponent's turn");
      renderBoard();
      
    } else if (decoded.type === 'move') {
      // Individual move update (from opponent or server response)
      const { position, player } = decoded;
      if (position !== undefined && position >= 1 && position <= 9) {
        gameState.board[position - 1] = player; // Convert to 0-based
        gameState.currentPlayer = player === 'X' ? 'O' : 'X';
        gameState.myTurn = (gameState.currentPlayer === gameState.mySymbol);
        
        // Handle timer switching for timed mode
        if (gameState.gameMode === 'timed' && gameState.timers) {
          const currentPlayerId = gameState.myTurn ? gameState.session.user_id : gameState.opponent.id;
          const previousPlayerId = currentPlayerId === gameState.session.user_id ? gameState.opponent.id : gameState.session.user_id;

          // Reset timer for the player who just moved
          gameState.timers.remaining[previousPlayerId] = gameState.timers.perMoveMs;

          // Start timer for current player if it's their turn
          if (gameState.myTurn) {
            startTimer();
          }
        }

        // Check for game over conditions
        const winner = checkWinner(gameState.board);
        if (winner) {
          gameState.isGameOver = true;
          gameState.winner = winner;
          gameState.winningLine = getWinningLine(gameState.board);
          stopTimer();
        } else if (gameState.board.every(cell => cell !== "")) {
          gameState.isGameOver = true;
          gameState.winner = 'draw';
          stopTimer();
        }
        
        // Update UI for both players
        updateGameStatus();
        updateTimerDisplay();
      }
    } else if (decoded.type === 'move_made') {
      // Individual move update
      const { position, player } = decoded;
      if (position !== undefined && position >= 1 && position <= 9) {
        gameState.board[position - 1] = player; // Convert to 0-based
        gameState.currentPlayer = player === 'X' ? 'O' : 'X';
        gameState.myTurn = (gameState.currentPlayer === gameState.mySymbol);
        
        // Handle timer switching for timed mode
        if (gameState.gameMode === 'timed' && gameState.timers) {
          const currentPlayerId = gameState.myTurn ? gameState.session.user_id : gameState.opponent.id;
          const previousPlayerId = currentPlayerId === gameState.session.user_id ? gameState.opponent.id : gameState.session.user_id;
          
          // Reset timer for the player who just moved
          gameState.timers.remaining[previousPlayerId] = gameState.timers.perMoveMs;
          
          // Start timer for current player if it's their turn
          if (gameState.myTurn) {
            startTimer();
          }
        }
        
        // Check for game over conditions
        const winner = checkWinner(gameState.board);
        if (winner) {
          gameState.isGameOver = true;
          gameState.winner = winner;
          gameState.winningLine = getWinningLine(gameState.board);
          stopTimer();
        } else if (gameState.board.every(cell => cell !== "")) {
          gameState.isGameOver = true;
          gameState.winner = 'draw';
          stopTimer();
        }
      }
    } else if (decoded.type === 'game_over') {
      // Game over state
      gameState.isGameOver = true;
      gameState.winner = decoded.winner || null;
      gameState.winningLine = decoded.winning_line || [];
    } else if (decoded.type === 'rematch_request') {
      // Handle rematch request from opponent
      if (!gameState.rematchRequested) {
        gameState.rematchRequested = [];
      }
      if (!gameState.rematchRequested.includes(decoded.userId)) {
        gameState.rematchRequested.push(decoded.userId);
      }
      
      // Check if both players have requested a rematch
      if (gameState.rematchRequested.length >= 2) {
        restartGame();
        updateStatus('Rematch accepted! New game starting...');
      } else {
        updateStatus('Opponent requested a rematch');
      }
    }

    // Update the UI
    renderBoard();
    updateGameStatus();
    
  } catch (error) {
    console.error("Error processing match data:", error, matchData);
  }
}

// Start a bot game
function startBotGame() {
  // Reset game state
  resetGame();
  
  // Set up bot game
  gameState.mySymbol = 'X';
  gameState.myUsername = usernameEl.value.trim();
  gameState.opponent = {
    id: 'bot',
    username: 'Bot',
    symbol: 'O'
  };
  gameState.myTurn = true;
  gameState.gameMode = 'classic';
  gameState.matchId = 'bot-game';
  
  // Show the board
  const boardWrap = document.getElementById('board-wrap');
  if (boardWrap) {
    boardWrap.classList.remove('hidden');
  }
  
  // Update UI
  updatePlayerInfo();
  updateStatus('Your turn (X)');
  renderBoard();
}

// Bot move logic
function makeBotMove() {
  if (gameState.isGameOver || !gameState.opponent || gameState.opponent.id !== 'bot') return;
  
  // Simple AI: random move for now
  const emptyCells = gameState.board
    .map((cell, index) => cell === '' ? index : null)
    .filter(index => index !== null);
  
  if (emptyCells.length > 0) {
    const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    gameState.board[randomIndex] = 'O';
    gameState.currentPlayer = 'X';
    gameState.myTurn = true;
    
    // Check for win/draw
    const winner = checkWinner(gameState.board);
    if (winner) {
      gameState.isGameOver = true;
      gameState.winner = winner;
      gameState.winningLine = getWinningLine(gameState.board);
    } else if (gameState.board.every(cell => cell !== '')) {
      gameState.isGameOver = true;
      gameState.winner = 'draw';
    }
    
    // Update UI
    renderBoard();
    updateGameStatus();
  }
}

// Make a move
async function makeMove(cellIndex) {
  if (!gameState.myTurn || gameState.isGameOver) {
    console.log("⚠️ Not your turn or game over");
    return;
  }

  if (gameState.board[cellIndex] !== "") {
    console.log("⚠️ Cell already taken");
    return;
  }

  try {
    // For bot games, update directly without socket
    if (gameState.matchId === 'bot-game') {
      // Make the move
      gameState.board[cellIndex] = gameState.mySymbol;
      gameState.currentPlayer = gameState.mySymbol === 'X' ? 'O' : 'X';
      gameState.myTurn = false;
      
      // Check for win/draw
      const winner = checkWinner(gameState.board);
      if (winner) {
        gameState.isGameOver = true;
        gameState.winner = winner;
        gameState.winningLine = getWinningLine(gameState.board);
      } else if (gameState.board.every(cell => cell !== "")) {
        gameState.isGameOver = true;
        gameState.winner = 'draw';
      }
      
      // Update UI
      renderBoard();
      updateGameStatus();
      
      // Make bot move after delay
      if (!gameState.isGameOver) {
        setTimeout(() => makeBotMove(), 1000);
      }
      return;
    }
    
    // Create move data
    const moveData = {
      type: "move",
      position: cellIndex + 1, // Convert to 1-based for server
      player: gameState.mySymbol
    };

    console.log("🚀 Sending move:", moveData);

    // Send the move to the server first
    if (!socket) throw new Error("Socket not connected");
    if (!gameState.matchId) throw new Error("No active match");
    
    // Send the move with op_code 1
    await socket.sendMatchState(
      gameState.matchId,
      1, // op_code
      moveData
    );

    // Don't do optimistic update - wait for server response
    // This prevents desync issues

    // Update UI to show move is being sent
    updateStatus("Sending move...");
    renderBoard();
    
    // If playing against bot, make bot move
    if (gameState.matchId === 'bot-game' && !gameState.isGameOver) {
      setTimeout(() => makeBotMove(), 1000);
    }
  } catch (error) {
    console.error("Error making move:", error);
    updateStatus("Error making move. Please try again.");

    // Revert optimistic update on error
    gameState.board[cellIndex] = "";
    gameState.myTurn = true;
    gameState.currentPlayer = gameState.mySymbol;
    renderBoard();
    
    // Show error to user
    alert(`Failed to make move: ${error.message}`);
  }
}

// Show result overlay
function showResult(winText, youWon) {
  const resultOverlay = document.getElementById('result-overlay');
  const resultText = document.getElementById('result-text');
  if (resultOverlay && resultText) {
    resultText.textContent = winText;
    resultText.className = youWon ? 'winner' : 'loser';
    resultOverlay.classList.add('show');
  }
}

// Hide result overlay
function hideResult() {
  const resultOverlay = document.getElementById('result-overlay');
  if (resultOverlay) {
    resultOverlay.classList.remove('show');
  }
}

// Request rematch
async function requestRematch() {
  if (!socket || !gameState.matchId) {
    console.error('Cannot request rematch: not in a match');
    return;
  }
  
  try {
    // Mark that we've requested a rematch
    if (!gameState.rematchRequested) {
      gameState.rematchRequested = [];
    }
    gameState.rematchRequested.push(gameState.session.user_id);
    
    // Send rematch request to server
    await socket.sendMatchState(gameState.matchId, 2, {
      type: 'rematch_request'
    });
    
    updateStatus('Rematch requested...');
    
    // Hide the rematch button
    const rematchBtn = document.getElementById('request-rematch-btn');
    if (rematchBtn) {
      rematchBtn.style.display = 'none';
    }
    
  } catch (error) {
    console.error('Failed to request rematch:', error);
    updateStatus('Failed to request rematch');
  }
}

// Update leaderboard with game result
function updateLeaderboardWithResult(youWon) {
  const username = usernameEl.value.trim();
  if (!username) return;
  
  // Find existing player entry
  const existingPlayer = gameState.leaderboard.find(p => p.username === username);
  
  if (existingPlayer) {
    existingPlayer.wins += youWon ? 1 : 0;
    existingPlayer.losses += youWon ? 0 : 1;
    existingPlayer.score = existingPlayer.wins * 10 - existingPlayer.losses * 5;
  } else {
    // Add new player
    gameState.leaderboard.push({
      username,
      wins: youWon ? 1 : 0,
      losses: youWon ? 0 : 1,
      score: youWon ? 10 : -5
    });
  }
  
  // Sort leaderboard by score
  gameState.leaderboard.sort((a, b) => b.score - a.score);
  
  // Save to localStorage
  localStorage.setItem('ticTacToeLeaderboard', JSON.stringify(gameState.leaderboard));
  
  // Update display
  updateLeaderboardDisplay();
}

// Update game status
function updateGameStatus() {
  // Update the status message
  if (gameState.isGameOver) {
    console.log("🏁 Game over detected:", {
      winner: gameState.winner,
      mySymbol: gameState.mySymbol,
      opponent: gameState.opponent
    });
    
    let resultText = '';
    let youWon = false;
    
    if (gameState.winner === 'draw') {
      resultText = "It's a draw!";
      updateStatus("Game Over - It's a draw!");
    } else if (gameState.winner === gameState.mySymbol) {
      resultText = "You win!";
      youWon = true;
      updateStatus("🎉 You win!");
    } else {
      const winnerName = gameState.winner === 'X' 
        ? (gameState.mySymbol === 'X' ? 'You' : (gameState.opponent?.username || 'X'))
        : (gameState.mySymbol === 'O' ? 'You' : (gameState.opponent?.username || 'O'));
      resultText = `${winnerName} wins!`;
      updateStatus(`Game Over - ${winnerName} wins!`);
    }
    
    // Show result overlay
    showResult(resultText, youWon);
    
    // Update leaderboard with game result
    updateLeaderboardWithResult(youWon);
    
    // Show rematch button for multiplayer games
    const rematchBtn = document.getElementById('request-rematch-btn');
    if (rematchBtn && gameState.matchId) {
      rematchBtn.style.display = 'inline-block';
    }
    
  } else {
    // Show current game status
    const currentPlayerSymbol = gameState.currentPlayer;
    const isMyTurn = gameState.myTurn;
    const currentPlayerName = currentPlayerSymbol === gameState.mySymbol 
      ? 'Your turn' 
      : `Waiting for ${gameState.opponent?.username || 'opponent'}`;
    
    updateStatus(`${currentPlayerName} (${currentPlayerSymbol})`);
  }
  
  // Update the player info display
  updatePlayerInfo();
}

// Update player information display
function updatePlayerInfo() {
  const yourNameEl = document.getElementById('your-name');
  const yourSymbolEl = document.getElementById('your-symbol');
  const opponentNameEl = document.getElementById('opponent-name');
  const opponentSymbolEl = document.getElementById('opponent-symbol');
  
  // For bot games
  if (gameState.matchId === 'bot-game') {
    if (yourNameEl) yourNameEl.textContent = gameState.myUsername || 'You';
    if (yourSymbolEl) yourSymbolEl.textContent = gameState.mySymbol || '-';
    if (opponentNameEl) opponentNameEl.textContent = 'Bot';
    if (opponentSymbolEl) opponentSymbolEl.textContent = 'O';
    return;
  }
  
  // For multiplayer games
  if (yourNameEl) yourNameEl.textContent = gameState.myUsername || 'You';
  if (yourSymbolEl) yourSymbolEl.textContent = gameState.mySymbol || '-';
  if (opponentNameEl) opponentNameEl.textContent = gameState.opponent?.username || 'Waiting...';
  if (opponentSymbolEl) opponentSymbolEl.textContent = gameState.opponent?.symbol || '-';
}

// Render the game board
function renderBoard() {
  if (!boardEl) return;
  boardEl.innerHTML = '';
  
  console.log("Rendering board. myTurn:", gameState.myTurn, "isGameOver:", gameState.isGameOver);

  gameState.board.forEach((cell, index) => {
    const cellEl = document.createElement('div');
    cellEl.className = 'cell';
    cellEl.textContent = cell;
    
    if (cell === 'X') cellEl.classList.add('x');
    if (cell === 'O') cellEl.classList.add('o');
    if (gameState.winningLine && gameState.winningLine.includes(index)) cellEl.classList.add('winning');

    if (gameState.myTurn && !gameState.isGameOver && cell === "") {
      cellEl.classList.add('clickable');
      cellEl.addEventListener('click', () => makeMove(index));
      console.log(`Cell ${index} is clickable`);
    } else {
      cellEl.classList.add('disabled');
    }

    boardEl.appendChild(cellEl);
  });
  
  // Update timer display
  updateTimerDisplay();
}

// Check for winner (local)
function checkWinner(board) {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  if (board.every(cell => cell !== "")) {
    return 'draw';
  }

  return null;
}

// Get winning line (local)
function getWinningLine(board) {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return pattern;
    }
  }

  return [];
}

// Update status message
function updateStatus(message) {
  if (statusEl) {
    statusEl.textContent = message;
  } else {
    console.log("STATUS:", message);
  }
}

// Reset the entire game state
function resetGame() {
  // Stop any ongoing timers
  stopTimer();
  
  // Reset game state to initial values
  gameState.board = Array(9).fill("");
  gameState.currentPlayer = "X";
  gameState.mySymbol = "";
  gameState.opponent = { id: "", username: "", symbol: "" };
  gameState.isGameOver = false;
  gameState.winningLine = [];
  gameState.myTurn = false;
  gameState.matchId = null;
  gameState.winner = null;
  gameState.gameMode = 'classic';
  gameState.timers = null;
  gameState.rematchRequested = [];
  
  // Hide board and result overlay
  const boardWrap = document.getElementById('board-wrap');
  if (boardWrap) {
    boardWrap.classList.add('hidden');
  }
  hideResult();
  
  // Reset UI
  renderBoard();
  updateGameStatus();
  updatePlayerInfo();
  updateTimerDisplay();
}

// Restart the game (for rematch)
function restartGame() {
  gameState.board = Array(9).fill("");
  gameState.isGameOver = false;
  gameState.winningLine = [];
  gameState.winner = null;
  gameState.myTurn = (gameState.mySymbol === 'X');
  gameState.rematchRequested = [];
  
  // Hide result overlay
  hideResult();
  
  // Reset timers for timed mode
  if (gameState.gameMode === 'timed' && gameState.timers) {
    gameState.timers.remaining[gameState.session.user_id] = gameState.timers.perMoveMs;
    gameState.timers.remaining[gameState.opponent.id] = gameState.timers.perMoveMs;
    startTimer();
  }
  
  renderBoard();
  updateGameStatus();
}

// Timer management
let timerInterval;

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  
  if (gameState.gameMode !== 'timed' || !gameState.timers) return;
  
  timerInterval = setInterval(() => {
    if (gameState.isGameOver) return;
    
    const currentPlayerId = gameState.myTurn ? gameState.session.user_id : gameState.opponent.id;
    const remainingTime = gameState.timers.remaining[currentPlayerId];
    
    if (remainingTime > 0) {
      gameState.timers.remaining[currentPlayerId] = Math.max(0, remainingTime - 100);
      updateTimerDisplay();
    } else {
      // Time's up - other player wins
      const winnerId = currentPlayerId === gameState.session.user_id ? gameState.opponent.id : gameState.session.user_id;
      gameState.winner = winnerId;
      gameState.isGameOver = true;
      clearInterval(timerInterval);
      updateGameStatus();
      showGameOver();
    }
  }, 100);
}

function updateTimerDisplay() {
  if (!timerEl) return;
  
  // Hide timer for non-timed games or bot games
  if (gameState.gameMode !== 'timed' || gameState.matchId === 'bot-game') {
    timerEl.style.display = 'none';
    return;
  }
  
  // Show timer for timed multiplayer games
  if (!gameState.timers || !gameState.session) {
    timerEl.style.display = 'none';
    return;
  }
  
  timerEl.style.display = 'block';
  
  const currentPlayerId = gameState.myTurn ? gameState.session.user_id : gameState.opponent?.id;
  if (!currentPlayerId || !gameState.timers.remaining[currentPlayerId]) {
    timerEl.textContent = 'Time: --';
    return;
  }
  
  const remainingTime = gameState.timers.remaining[currentPlayerId];
  const seconds = Math.ceil(remainingTime / 1000);
  
  timerEl.textContent = `Time: ${seconds}s`;
  timerEl.style.color = seconds <= 5 ? '#ff4444' : '#36c2c2';
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Leaderboard functions
async function loadLeaderboard() {
  // Mock leaderboard data - replace with actual API call
  gameState.leaderboard = [
    { username: 'Ace', wins: 42, losses: 21, score: 2100 },
    { username: 'Boo', wins: 38, losses: 27, score: 1850 },
    { username: 'GridMaster', wins: 35, losses: 30, score: 1720 },
    { username: 'XOChamp', wins: 30, losses: 35, score: 1550 },
    { username: 'You', wins: 0, losses: 0, score: 1000 }
  ];
}

function updateLeaderboardDisplay() {
  const leaderboardEl = document.getElementById('leaderboard');
  if (!leaderboardEl) return;
  
  leaderboardEl.innerHTML = gameState.leaderboard
    .map((player, idx) => `
      <div class="leaderboard-item">
        <span class="rank">${idx + 1}.</span>
        <span class="username">${player.username}</span>
        <span class="stats">${player.wins}W/${player.losses}L</span>
        <span class="score">${player.score}</span>
      </div>
    `)
    .join('');
}

// Rematch functionality
async function requestRematch() {
  if (!gameState.matchId || gameState.rematchRequested.includes(gameState.session.user_id)) return;
  
  gameState.rematchRequested.push(gameState.session.user_id);
  
  // Notify opponent via Nakama
  try {
    await socket.sendMatchState(gameState.matchId, 1, {
      type: 'rematch_request',
      userId: gameState.session.user_id 
    });
  } catch (error) {
    console.error('Failed to send rematch request:', error);
  }
  
  updateGameStatus();
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', init);
