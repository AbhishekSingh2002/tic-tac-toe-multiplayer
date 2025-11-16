-- Unit tests for Tic-Tac-Toe game logic

local game_logic = require("game_logic.tic_tac_toe")

-- Test helper
local function assert_equal(actual, expected, message)
  if actual ~= expected then
    error(string.format("%s: expected %s, got %s", message or "Assertion failed", tostring(expected), tostring(actual)))
  end
end

local function test_create_game_state()
  print("Testing: create_game_state")
  
  local state = game_logic.create_game_state("player1", "player2")
  
  assert_equal(state.player_x_id, "player1", "Player X ID")
  assert_equal(state.player_o_id, "player2", "Player O ID")
  assert_equal(state.next_turn, "X", "Initial turn should be X")
  assert_equal(state.status, "active", "Initial status should be active")
  assert_equal(#state.board, 9, "Board should have 9 cells")
  
  -- Check all cells are empty
  for i = 1, 9 do
    assert_equal(state.board[i], "", string.format("Cell %d should be empty", i))
  end
  
  print("✓ create_game_state passed")
end

local function test_check_winner_row()
  print("Testing: check_winner - row wins")
  
  -- Test row 1 win
  local board = {"X", "X", "X", "", "", "", "", "", ""}
  local winner = game_logic.check_winner(board)
  assert_equal(winner, "X", "Row 1 should win for X")
  
  -- Test row 2 win
  board = {"", "", "", "O", "O", "O", "", "", ""}
  winner = game_logic.check_winner(board)
  assert_equal(winner, "O", "Row 2 should win for O")
  
  -- Test row 3 win
  board = {"", "", "", "", "", "", "X", "X", "X"}
  winner = game_logic.check_winner(board)
  assert_equal(winner, "X", "Row 3 should win for X")
  
  print("✓ check_winner (rows) passed")
end

local function test_check_winner_column()
  print("Testing: check_winner - column wins")
  
  -- Test column 1 win
  local board = {"X", "", "", "X", "", "", "X", "", ""}
  local winner = game_logic.check_winner(board)
  assert_equal(winner, "X", "Column 1 should win for X")
  
  -- Test column 2 win
  board = {"", "O", "", "", "O", "", "", "O", ""}
  winner = game_logic.check_winner(board)
  assert_equal(winner, "O", "Column 2 should win for O")
  
  -- Test column 3 win
  board = {"", "", "X", "", "", "X", "", "", "X"}
  winner = game_logic.check_winner(board)
  assert_equal(winner, "X", "Column 3 should win for X")
  
  print("✓ check_winner (columns) passed")
end

local function test_check_winner_diagonal()
  print("Testing: check_winner - diagonal wins")
  
  -- Test diagonal top-left to bottom-right
  local board = {"X", "", "", "", "X", "", "", "", "X"}
  local winner = game_logic.check_winner(board)
  assert_equal(winner, "X", "Diagonal TL-BR should win for X")
  
  -- Test diagonal top-right to bottom-left
  board = {"", "", "O", "", "O", "", "O", "", ""}
  winner = game_logic.check_winner(board)
  assert_equal(winner, "O", "Diagonal TR-BL should win for O")
  
  print("✓ check_winner (diagonals) passed")
end

local function test_check_winner_no_winner()
  print("Testing: check_winner - no winner")
  
  local board = {"X", "O", "X", "X", "O", "O", "O", "X", "X"}
  local winner = game_logic.check_winner(board)
  assert_equal(winner, nil, "Should have no winner")
  
  print("✓ check_winner (no winner) passed")
end

local function test_is_draw()
  print("Testing: is_draw")
  
  -- Full board, no winner (draw)
  local board = {"X", "O", "X", "X", "O", "O", "O", "X", "X"}
  local is_draw = game_logic.is_draw(board)
  assert_equal(is_draw, true, "Full board should be draw")
  
  -- Partial board (not draw)
  board = {"X", "O", "", "X", "", "", "", "", ""}
  is_draw = game_logic.is_draw(board)
  assert_equal(is_draw, false, "Partial board should not be draw")
  
  print("✓ is_draw passed")
end

local function test_validate_move()
  print("Testing: validate_move")
  
  local state = game_logic.create_game_state("player1", "player2")
  
  -- Valid move for X
  local valid, result = game_logic.validate_move(state, "player1", 1)
  assert_equal(valid, true, "Valid move should succeed")
  assert_equal(result, "X", "Should return player symbol")
  
  -- Invalid - not player's turn
  valid, result = game_logic.validate_move(state, "player1", 2)
  assert_equal(valid, false, "Second X move should fail")
  
  -- Apply first move
  state.board[1] = "X"
  state.next_turn = "O"
  
  -- Valid move for O
  valid, result = game_logic.validate_move(state, "player2", 2)
  assert_equal(valid, true, "Valid O move should succeed")
  
  -- Invalid - cell occupied
  valid, result = game_logic.validate_move(state, "player1", 1)
  assert_equal(valid, false, "Occupied cell should fail")
  
  -- Invalid - out of bounds
  valid, result = game_logic.validate_move(state, "player1", 10)
  assert_equal(valid, false, "Out of bounds should fail")
  
  print("✓ validate_move passed")
end

local function test_apply_move()
  print("Testing: apply_move")
  
  local state = game_logic.create_game_state("player1", "player2")
  
  -- Apply X move
  local new_state, status, winner_id = game_logic.apply_move(state, "X", 1)
  assert_equal(new_state.board[1], "X", "Board should be updated")
  assert_equal(new_state.next_turn, "O", "Turn should switch to O")
  assert_equal(status, "continue", "Game should continue")
  
  -- Apply O move
  new_state, status, winner_id = game_logic.apply_move(new_state, "O", 4)
  assert_equal(new_state.board[4], "O", "Board should be updated")
  assert_equal(new_state.next_turn, "X", "Turn should switch back to X")
  
  -- Create winning scenario
  new_state.board[2] = "X"
  new_state.board[3] = "X"
  new_state, status, winner_id = game_logic.apply_move(new_state, "X", 1)
  
  -- Note: board[1] is already "X", this is just for testing logic
  -- In real game, we'd apply to cell 3 after board[1] and board[2]
  
  print("✓ apply_move passed")
end

-- Run all tests
local function run_tests()
  print("\n=== Running Tic-Tac-Toe Game Logic Tests ===\n")
  
  local tests = {
    test_create_game_state,
    test_check_winner_row,
    test_check_winner_column,
    test_check_winner_diagonal,
    test_check_winner_no_winner,
    test_is_draw,
    test_validate_move,
    test_apply_move
  }
  
  local passed = 0
  local failed = 0
  
  for _, test in ipairs(tests) do
    local success, err = pcall(test)
    if success then
      passed = passed + 1
    else
      failed = failed + 1
      print("✗ Test failed: " .. tostring(err))
    end
  end
  
  print(string.format("\n=== Test Results: %d passed, %d failed ===\n", passed, failed))
  
  if failed > 0 then
    os.exit(1)
  end
end

-- Run tests if this file is executed directly
if arg and arg[0] == "test_game_logic.lua" then
  run_tests()
end

return {
  run_tests = run_tests
}
