-- Manual test for win detection
local nk = require("nakama")

-- Copy the exact check_winner function from tic_tac_toe.lua
local function check_winner(board)
    -- Check rows
    for i = 1, 7, 3 do
        if board[i] ~= "" and board[i] == board[i+1] and board[i] == board[i+2] then
            return board[i], {i, i+1, i+2}
        end
    end
    
    -- Check columns
    for i = 1, 3 do
        if board[i] ~= "" and board[i] == board[i+3] and board[i] == board[i+6] then
            return board[i], {i, i+3, i+6}
        end
    end
    
    -- Check diagonals
    if board[1] ~= "" and board[1] == board[5] and board[1] == board[9] then
        return board[1], {1, 5, 9}
    end
    if board[3] ~= "" and board[3] == board[5] and board[3] == board[7] then
        return board[3], {3, 5, 7}
    end
    
    -- Check for draw
    local is_draw = true
    for i = 1, 9 do
        if board[i] == "" then
            is_draw = false
            break
        end
    end
    
    if is_draw then
        return "draw", {}
    end
    
    return nil, nil
end

-- Test function
local function test_win_detection()
    nk.logger_info("=== MANUAL WIN DETECTION TEST ===")
    
    -- Test 1: Row win
    local board1 = {"X", "X", "X", "", "", "", "", "", ""}
    local winner1, line1 = check_winner(board1)
    nk.logger_info("Test 1 - Row win:")
    nk.logger_info("Board: " .. table.concat(board1, ","))
    nk.logger_info("Winner: " .. tostring(winner1))
    nk.logger_info("Line: " .. (line1 and table.concat(line1, ",") or "nil"))
    
    -- Test 2: Column win
    local board2 = {"O", "", "", "O", "", "", "O", "", ""}
    local winner2, line2 = check_winner(board2)
    nk.logger_info("Test 2 - Column win:")
    nk.logger_info("Board: " .. table.concat(board2, ","))
    nk.logger_info("Winner: " .. tostring(winner2))
    nk.logger_info("Line: " .. (line2 and table.concat(line2, ",") or "nil"))
    
    -- Test 3: Diagonal win
    local board3 = {"X", "", "", "", "X", "", "", "", "X"}
    local winner3, line3 = check_winner(board3)
    nk.logger_info("Test 3 - Diagonal win:")
    nk.logger_info("Board: " .. table.concat(board3, ","))
    nk.logger_info("Winner: " .. tostring(winner3))
    nk.logger_info("Line: " .. (line3 and table.concat(line3, ",") or "nil"))
    
    -- Test 4: Draw
    local board4 = {"X", "O", "X", "X", "O", "O", "O", "X", "X"}
    local winner4, line4 = check_winner(board4)
    nk.logger_info("Test 4 - Draw:")
    nk.logger_info("Board: " .. table.concat(board4, ","))
    nk.logger_info("Winner: " .. tostring(winner4))
    nk.logger_info("Line: " .. (line4 and table.concat(line4, ",") or "nil"))
    
    -- Test 5: No winner
    local board5 = {"X", "O", "X", "", "O", "", "O", "X", "X"}
    local winner5, line5 = check_winner(board5)
    nk.logger_info("Test 5 - No winner:")
    nk.logger_info("Board: " .. table.concat(board5, ","))
    nk.logger_info("Winner: " .. tostring(winner5))
    nk.logger_info("Line: " .. (line5 and table.concat(line5, ",") or "nil"))
    
    nk.logger_info("=== TEST COMPLETE ===")
end

-- Run the test
test_win_detection()

return "Manual win detection test completed"