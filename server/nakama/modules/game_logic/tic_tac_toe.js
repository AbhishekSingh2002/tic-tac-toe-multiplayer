// Tic-Tac-Toe Game Logic Module
const nk = require('nakama-runtime');

// Game state constants
const GAME_STATE = {
  WAITING_FOR_PLAYERS: 0,
  IN_PROGRESS: 1,
  FINISHED: 2
};

// Player marks
const MARKS = {
  NONE: 0,
  X: 1,
  O: 2
};

// Game result types
const RESULT = {
  NONE: 0,
  WIN: 1,
  DRAW: 2
};

// Game state class
class TicTacToeGame {
  constructor() {
    this.state = GAME_STATE.WAITING_FOR_PLAYERS;
    this.board = Array(9).fill(MARKS.NONE);
    this.players = [];
    this.currentPlayerIndex = 0;
    this.result = RESULT.NONE;
    this.winner = null;
    this.winningLine = [];
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }

  // Add a player to the game
  addPlayer(userId, username) {
    if (this.players.length >= 2) {
      throw new Error('Game is full');
    }

    const player = {
      id: userId,
      username: username,
      mark: this.players.length === 0 ? MARKS.X : MARKS.O
    };

    this.players.push(player);
    
    if (this.players.length === 2) {
      this.state = GAME_STATE.IN_PROGRESS;
    }

    return player;
  }

  // Make a move
  makeMove(playerId, position) {
    if (this.state !== GAME_STATE.IN_PROGRESS) {
      throw new Error('Game is not in progress');
    }

    if (position < 0 || position >= 9) {
      throw new Error('Invalid position');
    }

    if (this.board[position] !== MARKS.NONE) {
      throw new Error('Position already taken');
    }

    const currentPlayer = this.players[this.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      throw new Error('Not your turn');
    }

    // Make the move
    this.board[position] = currentPlayer.mark;
    this.updatedAt = Date.now();

    // Check for win or draw
    if (this.checkWin(currentPlayer.mark, position)) {
      this.state = GAME_STATE.FINISHED;
      this.result = RESULT.WIN;
      this.winner = currentPlayer;
      this.updateLeaderboard(currentPlayer.id, this.players.find(p => p.id !== currentPlayer.id)?.id);
    } else if (this.isBoardFull()) {
      this.state = GAME_STATE.FINISHED;
      this.result = RESULT.DRAW;
      // Update leaderboard for draw
      this.updateLeaderboard(null, null, true);
    } else {
      // Switch to the other player
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 2;
    }

    return {
      board: [...this.board],
      currentPlayer: this.players[this.currentPlayerIndex],
      state: this.state,
      result: this.result,
      winner: this.winner,
      winningLine: this.winningLine
    };
  }

  // Check if the current move resulted in a win
  checkWin(mark, position) {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    // Check all possible winning patterns
    for (const pattern of winPatterns) {
      if (pattern.includes(position) && 
          this.board[pattern[0]] === mark && 
          this.board[pattern[1]] === mark && 
          this.board[pattern[2]] === mark) {
        this.winningLine = [...pattern];
        return true;
      }
    }
    return false;
  }

  // Check if the board is full (draw)
  isBoardFull() {
    return this.board.every(cell => cell !== MARKS.NONE);
  }

  // Update leaderboard after game ends
  async updateLeaderboard(winnerId, loserId, isDraw = false) {
    try {
      // Update winner's stats
      if (winnerId && !isDraw) {
        await nk.leaderboardRecordWrite('wins', winnerId, 'increment', 1);
        await nk.leaderboardRecordWrite('elo', winnerId, 'set', (await this.getPlayerScore(winnerId)) + 10);
      }
      
      // Update loser's stats
      if (loserId && !isDraw) {
        await nk.leaderboardRecordWrite('losses', loserId, 'increment', 1);
        await nk.leaderboardRecordWrite('elo', loserId, 'set', Math.max(0, (await this.getPlayerScore(loserId)) - 5));
      }
      
      // Update draws
      if (isDraw && this.players.length === 2) {
        for (const player of this.players) {
          await nk.leaderboardRecordWrite('draws', player.id, 'increment', 1);
          await nk.leaderboardRecordWrite('elo', player.id, 'set', (await this.getPlayerScore(player.id)) + 2);
        }
      }
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  }

  // Get player's current score
  async getPlayerScore(userId) {
    try {
      const records = await nk.leaderboardRecordsList('elo', [userId], 1);
      return records.records.length > 0 ? records.records[0].score : 1000; // Default ELO: 1000
    } catch (error) {
      console.error('Error getting player score:', error);
      return 1000;
    }
  }

  // Get game state for client
  getState() {
    return {
      state: this.state,
      board: [...this.board],
      players: [...this.players],
      currentPlayer: this.players[this.currentPlayerIndex],
      result: this.result,
      winner: this.winner,
      winningLine: this.winningLine,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Export the game class
module.exports = TicTacToeGame;
