-- Tic-Tac-Toe Match Handler - FIXED
local nk = require("nakama")
local M = {}

local TICK_RATE = 10
local TIMEOUT_TICKS = 3000

-- Matchmaker matched handler
function M.matchmaker_matched(context, matched)
    nk.logger_info("🎮 Matchmaker matched: " .. nk.json_encode(matched))

    -- Extract player information
    local players = {}
    for _, user in ipairs(matched.users) do
        table.insert(players, {
            user_id = user.presence.user_id,
            username = user.presence.username,
            properties = user.properties,
            presence = user.presence
        })
    end

    -- Assign X to first player, O to second (defensive checks)
    local player_x = players[1] or { user_id = "", username = "Player X", presence = {} }
    local player_o = players[2] or { user_id = "", username = "Player O", presence = {} }

    -- Create match label
    local label = nk.json_encode({
        type = "tic-tac-toe",
        player_x = player_x.user_id,
        player_o = player_o.user_id,
        usernames = {
            [player_x.user_id] = player_x.username,
            [player_o.user_id] = player_o.username
        }
    })

    -- Return match parameters
    return nk.json_encode({
        match = {
            match_id = nil, -- Let Nakama generate the match ID
            authoritative = true,
            label = label,
            size = 2,
            tick_rate = TICK_RATE,
            handler_name = "tic_tac_toe",
            params = {
                player_x_id = player_x.user_id,
                player_o_id = player_o.user_id,
                player_x_username = player_x.username,
                player_o_username = player_o.username
            }
        },
        users = {
            { user_id = player_x.user_id, session_id = player_x.presence.session_id },
            { user_id = player_o.user_id, session_id = player_o.presence.session_id }
        }
    })
end

-- Helper functions
local function is_cell_empty(cell)
    return cell == nil or cell == ""
end

local function has_empty_cells(board)
    for i = 1, 9 do
        if is_cell_empty(board[i]) then
            return true
        end
    end
    return false
end

-- returns winner ("X"/"O") and winning_line (table) or nil,nil, or "draw",{}
local function check_winner(board)
    if not board or type(board) ~= "table" then
        return nil, nil
    end

    local safe_board = {}
    for i = 1, 9 do
        safe_board[i] = board[i] or ""
    end

    local lines = {
        {1, 2, 3}, {4, 5, 6}, {7, 8, 9},
        {1, 4, 7}, {2, 5, 8}, {3, 6, 9},
        {1, 5, 9}, {3, 5, 7}
    }

    for _, line in ipairs(lines) do
        local a, b, c = safe_board[line[1]], safe_board[line[2]], safe_board[line[3]]
        if a ~= "" and a == b and b == c then
            nk.logger_info(string.format("✅ Winner: %s on line %s", a, table.concat(line, ",")))
            return a, line
        end
    end

    -- Check for draw
    if not has_empty_cells(safe_board) then
        return "draw", {}
    end

    return nil, nil
end

-- Initialize match
function M.match_init(context, params)
    nk.logger_info("🆕 Match init: " .. tostring(params and params.match_id or "nil"))
    nk.logger_info("🔄 Match params: " .. nk.json_encode(params or {}))

    -- Extract player information from params or defaults
    local player_x_id = (params and params.player_x_id) or ""
    local player_o_id = (params and params.player_o_id) or ""
    local player_x_username = (params and params.player_x_username) or "Player X"
    local player_o_username = (params and params.player_o_username) or "Player O"

    local state = {
        match_id = (params and params.match_id) or "unknown",
        player_x_id = player_x_id,
        player_o_id = player_o_id,
        player_x_username = player_x_username,
        player_o_username = player_o_username,
        board = {"", "", "", "", "", "", "", "", ""},
        current_player = "X",
        game_over = false,
        winner = nil,
        winning_line = nil,
        presences = {},
        disconnected = {},
        match_started = false,
        created_at = os.time()
    }

    local label = nk.json_encode({
        type = "tic-tac-toe",
        match_id = state.match_id
    })

    return state, TICK_RATE, label
end

-- Join attempt
function M.match_join_attempt(context, dispatcher, tick, state, presence, metadata)
    state.presences = state.presences or {}

    local user_id = presence and presence.user_id
    if not user_id then
        return state, false, "Invalid presence"
    end

    -- Assign players if not already assigned
    if state.player_x_id == "" then
        state.player_x_id = user_id
        state.player_x_username = presence.username or ("Player %d"):format(os.time() % 1000)
    elseif state.player_o_id == "" and user_id ~= state.player_x_id then
        state.player_o_id = user_id
        state.player_o_username = presence.username or ("Player %d"):format(os.time() % 1001)
    elseif user_id ~= state.player_x_id and user_id ~= state.player_o_id then
        return state, false, "Match is full"
    end

    -- Count current connections (not including this new presence yet)
    local connection_count = 0
    for _, _ in pairs(state.presences) do
        connection_count = connection_count + 1
    end

    -- Allow up to 2 connections (1 per player)
    if connection_count >= 2 then
        -- Check for reconnection
        for _, p in pairs(state.presences) do
            if p.user_id == user_id then
                return state, true, "Reconnection accepted"
            end
        end
        return state, false, "Match is full"
    end

    return state, true, "Join accepted"
end

-- Player joined
function M.match_join(context, dispatcher, tick, state, presences)
    state.presences = state.presences or {}

    -- Add new presences
    for _, presence in ipairs(presences) do
        state.presences[presence.session_id] = presence
        state.disconnected[presence.user_id] = nil
        nk.logger_info("✅ Player joined: " .. presence.user_id .. " (" .. (presence.username or "unknown") .. ")")
    end

    -- Count current connections
    local connection_count = 0
    for _, _ in pairs(state.presences) do
        connection_count = connection_count + 1
    end

    -- Prepare player information for broadcast
    local players = {}
    for _, p in pairs(state.presences) do
        local symbol = (p.user_id == state.player_x_id) and "X" or
                      (p.user_id == state.player_o_id) and "O" or "?"
        table.insert(players, {
            user_id = p.user_id,
            username = p.username or ("Player %d"):format(os.time() % 1000),
            symbol = symbol
        })
    end

    -- Send initial game state to all players
    if not state.match_started then
        state.match_started = true
        
        -- Send initial game state to all players
        local initial_state = {
            type = "match_start",
            board = state.board,
            current_player = state.current_player,
            game_over = false,
            player_x_id = state.player_x_id,
            player_o_id = state.player_o_id,
            player_x_username = state.player_x_username,
            player_o_username = state.player_o_username,
            players = {
                { id = state.player_x_id, username = state.player_x_username, symbol = "X" },
                { id = state.player_o_id, username = state.player_o_username, symbol = "O" }
            }
        }
        
        dispatcher.broadcast_message(1, nk.json_encode(initial_state))
        nk.logger_info("🚀 Match started! Players: " .. state.player_x_username .. " (X) vs " .. state.player_o_username .. " (O)")
    end

    -- Send game state to all players
    local payload = {
        type = "game_state",
        state = {
            board = state.board,
            current_player = state.current_player,
            game_over = state.game_over,
            winner = state.winner,
            winning_line = state.winning_line,
            player_x_id = state.player_x_id,
            player_o_id = state.player_o_id,
            player_x_username = state.player_x_username,
            player_o_username = state.player_o_username,
            players = players
        }
    }

    dispatcher.broadcast_message(1, nk.json_encode(payload))

    -- Log the current match state
    nk.logger_info("📊 Match state: " .. nk.json_encode({
        player_x = state.player_x_username,
        player_o = state.player_o_username,
        current_player = state.current_player,
        game_over = state.game_over,
        winner = state.winner,
        connections = connection_count
    }))

    return state
end

-- Player left
function M.match_leave(context, dispatcher, tick, state, presences)
    state.presences = state.presences or {}
    state.disconnected = state.disconnected or {}

    local disconnected_players = {}

    -- Mark players as disconnected
    for _, presence in ipairs(presences) do
        state.presences[presence.session_id] = nil
        state.disconnected[presence.user_id] = tick
        table.insert(disconnected_players, presence.user_id)
        nk.logger_info("⚠️ Player left: " .. presence.user_id .. " (" .. (presence.username or "unknown") .. ")")
    end

    -- If the game was in progress and a player left, end the game
    if not state.game_over and #disconnected_players > 0 then
        local disconnected_x = false
        local disconnected_o = false

        for _, user_id in ipairs(disconnected_players) do
            if user_id == state.player_x_id then
                disconnected_x = true
            elseif user_id == state.player_o_id then
                disconnected_o = true
            end
        end

        if disconnected_x or disconnected_o then
            state.game_over = true
            state.winner = disconnected_x and "O" or "X"
            nk.logger_info(string.format("🏁 Game over due to player disconnect. Winner: %s", state.winner))

            local winner_username = disconnected_x and state.player_o_username or state.player_x_username
            local payload = {
                type = "player_disconnected",
                disconnected_players = disconnected_players,
                winner = state.winner,
                winner_username = winner_username,
                game_over = true
            }
            dispatcher.broadcast_message(1, nk.json_encode(payload))
        end
    end

    -- Log the current match state
    local connection_count = 0
    for _ in pairs(state.presences) do connection_count = connection_count + 1 end

    nk.logger_info("📊 Match state after leave: " .. nk.json_encode({
        players_connected = connection_count,
        game_over = state.game_over,
        winner = state.winner
    }))

    return state
end

-- Main game loop - handles all incoming messages
function M.match_loop(context, dispatcher, tick, state, messages)
    state.disconnected = state.disconnected or {}
    state.presences = state.presences or {}

    -- Process all incoming messages
    for _, message in ipairs(messages) do
        if not message or not message.sender then
            goto continue
        end

        -- Handle move messages (op_code 1)
        if message.op_code == 1 then
            -- Decode the incoming message (JSON -> table)
            local ok, data = pcall(nk.json_decode, message.data)
            if not ok or type(data) ~= "table" or data.type ~= "move" then
                nk.logger_warn("Invalid move data payload: " .. tostring(message.data))
                goto continue
            end

            -- Determine which player is making the move
            local player = nil
            local player_username = nil

            if message.sender.user_id == state.player_x_id then
                player = "X"
                player_username = state.player_x_username
            elseif message.sender.user_id == state.player_o_id then
                player = "O"
                player_username = state.player_o_username
            else
                nk.logger_warn("Unauthorized move attempt from: " .. message.sender.user_id)
                goto continue
            end

            -- Validate it's the player's turn and game is still active
            if player ~= state.current_player then
                nk.logger_warn(string.format("⚠️ Wrong turn: %s tried to move on %s's turn",
                    player, state.current_player))
                goto continue
            end

            if state.game_over then
                nk.logger_warn("⚠️ Game is already over")
                goto continue
            end

            -- Validate position (1-9)
            local position = tonumber(data.position)
            if not position or position < 1 or position > 9 then
                nk.logger_warn("❌ Invalid position: " .. tostring(position))
                goto continue
            end

            -- Check if cell is empty
            if state.board[position] ~= "" then
                nk.logger_warn(string.format("❌ Cell %d already taken by %s", position, state.board[position]))
                goto continue
            end

            -- Make the move
            state.board[position] = player
            nk.logger_info(string.format("🎮 Move: %s (%s) at position %d",
                player, player_username or "unknown", position))

            -- Check for winner or draw
            local winner, winning_line = check_winner(state.board)
            if winner then
                state.game_over = true
                state.winner = winner
                state.winning_line = winning_line
                nk.logger_info(string.format("🏆 Game over! Winner: %s", winner))
            elseif not winner and not has_empty_cells(state.board) then
                state.game_over = true
                state.winner = "draw"
                nk.logger_info("🤝 Game over: It's a draw!")
            else
                -- Switch to the other player's turn
                state.current_player = (player == "X") and "O" or "X"
            end

            -- Prepare the game state update
            local response = {
                type = state.game_over and "game_over" or "game_state",
                state = {
                    board = state.board,
                    current_player = state.current_player,
                    game_over = state.game_over,
                    winner = state.winner,
                    winning_line = state.winning_line,
                    player_x_id = state.player_x_id,
                    player_o_id = state.player_o_id,
                    player_x_username = state.player_x_username,
                    player_o_username = state.player_o_username,
                    last_move = {
                        position = position,
                        player = player,
                        player_username = player_username
                    }
                }
            }

            if state.game_over then
                response.state.winner_username = (state.winner == "X" and state.player_x_username)
                                               or (state.winner == "O" and state.player_o_username)
                                               or ""
            end

            -- Broadcast the updated game state to all players
            dispatcher.broadcast_message(1, nk.json_encode(response))

            -- Log the move and new state
            nk.logger_info("📤 Broadcasted move: " .. nk.json_encode({
                position = position,
                player = player,
                current_player = state.current_player,
                game_over = state.game_over,
                winner = state.winner
            }))

            -- Log the current board state
            nk.logger_info("📋 Board state: " .. table.concat(state.board, ","))

        end

        ::continue::
    end

    -- Check for player timeouts periodically
    if tick % 10 == 0 then  -- Check every 10 ticks
        for user_id, disconnect_tick in pairs(state.disconnected) do
            if tick - disconnect_tick > TIMEOUT_TICKS then
                nk.logger_info("⏱️ Player timeout: " .. user_id)

                -- If the game is still active, end it
                if not state.game_over then
                    state.game_over = true

                    -- Determine the winner (the player who didn't disconnect)
                    if user_id == state.player_x_id then
                        state.winner = "O"
                        state.winner_username = state.player_o_username
                    elseif user_id == state.player_o_id then
                        state.winner = "X"
                        state.winner_username = state.player_x_username
                    end

                    -- Notify remaining players
                    local payload = {
                        type = "game_over",
                        state = {
                            game_over = true,
                            winner = state.winner,
                            winner_username = state.winner_username,
                            reason = "player_timeout"
                        }
                    }
                    dispatcher.broadcast_message(1, nk.json_encode(payload))

                    nk.logger_info(string.format("🏁 Game over due to timeout. Winner: %s (%s)",
                        state.winner, state.winner_username or "unknown"))
                end

                -- Remove from disconnected list
                state.disconnected[user_id] = nil
            end
        end
    end

    return state
end

function M.match_terminate(context, dispatcher, tick, state, grace_seconds)
    nk.logger_info("🏁 Match terminated: " .. tostring(state and state.match_id or "nil"))
    return state
end

function M.match_signal(context, dispatcher, tick, state, data)
    dispatcher.broadcast_message(5, data)
    return state, data
end

return M
