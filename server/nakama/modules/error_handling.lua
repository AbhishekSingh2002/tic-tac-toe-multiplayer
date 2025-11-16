-- Error handling module for Tic-Tac-Toe game

local M = {}

-- Standard error codes
M.ERROR_CODES = {
    -- General errors (1-99)
    INTERNAL_ERROR = 1,      -- Internal server error
    UNAUTHORIZED = 2,        -- Not authenticated
    INVALID_INPUT = 3,       -- Invalid request data
    NOT_FOUND = 4,           -- Resource not found
    PERMISSION_DENIED = 5,   -- Not authorized
    RATE_LIMIT = 6,          -- Too many requests
    TIMEOUT = 7,             -- Operation timed out
    
    -- Game-specific errors (100-199)
    GAME_NOT_FOUND = 100,
    INVALID_MOVE = 101,
    NOT_YOUR_TURN = 102,
    GAME_ALREADY_OVER = 103,
    CELL_OCCUPIED = 104,
    INVALID_PLAYER = 105,
    
    -- Matchmaking errors (200-299)
    MATCHMAKING_ERROR = 200,
    MATCH_FULL = 201,
    ALREADY_IN_MATCH = 202,
    
    -- Authentication errors (300-399)
    INVALID_CREDENTIALS = 300,
    SESSION_EXPIRED = 301,
    ACCOUNT_LOCKED = 302,
    
    -- Rate limiting (400-499)
    TOO_MANY_REQUESTS = 400,
    RATE_LIMIT_EXCEEDED = 401
}

-- Create an error response
function M.create_error(code, message, details)
    return {
        code = code,
        message = message or "An error occurred",
        details = details or {}
    }
end

-- Throw an error with code and message
function M.throw_error(code, message, details)
    error(M.create_error(code, message, details))
end

-- Handle errors in RPC calls
function M.rpc_error_handler(fn)
    return function(context, payload)
        local success, result = pcall(fn, context, payload)
        if not success then
            if type(result) == "table" and result.code and result.message then
                -- Already a structured error
                return nk.json_encode(result)
            else
                -- Unhandled error, return generic error
                nk.logger_error("Unhandled error: " .. tostring(result))
                return nk.json_encode(M.create_error(
                    M.ERROR_CODES.INTERNAL_ERROR,
                    "An unexpected error occurred",
                    { error = tostring(result) }
                ))
            end
        end
        return result
    end
end

-- Validate required fields in a table
function M.validate_fields(data, required_fields)
    for _, field in ipairs(required_fields) do
        if data[field] == nil then
            M.throw_error(
                M.ERROR_CODES.INVALID_INPUT,
                string.format("Missing required field: %s", field)
            )
        end
    end
end

-- Validate string length
function M.validate_string_length(str, min_len, max_len, field_name)
    if not str or type(str) ~= "string" then
        M.throw_error(
            M.ERROR_CODES.INVALID_INPUT,
            string.format("%s must be a string", field_name or "Field")
        )
    end
    
    local len = #str
    if (min_len and len < min_len) or (max_len and len > max_len) then
        M.throw_error(
            M.ERROR_CODES.INVALID_INPUT,
            string.format(
                "%s must be between %d and %d characters",
                field_name or "Field",
                min_len or 0,
                max_len or "infinity"
            )
        )
    end
end

-- Validate number range
function M.validate_number_range(num, min_val, max_val, field_name)
    if type(num) ~= "number" or (min_val and num < min_val) or (max_val and num > max_val) then
        M.throw_error(
            M.ERROR_CODES.INVALID_INPUT,
            string.format(
                "%s must be a number between %s and %s",
                field_name or "Value",
                tostring(min_val or "-infinity"),
                tostring(max_val or "infinity")
            )
        )
    end
end

-- Validate player is in the game
function M.validate_player_in_game(state, player_id)
    if player_id ~= state.player_x_id and player_id ~= state.player_o_id then
        M.throw_error(
            M.ERROR_CODES.INVALID_PLAYER,
            "You are not a player in this game"
        )
    end
end

-- Validate game is active
function M.validate_game_active(state)
    if state.status ~= "active" then
        M.throw_error(
            M.ERROR_CODES.GAME_ALREADY_OVER,
            "This game is already over"
        )
    end
end

-- Validate it's player's turn
function M.validate_player_turn(state, player_id)
    local current_player = (state.next_turn == "X") and state.player_x_id or state.player_o_id
    if player_id ~= current_player then
        M.throw_error(
            M.ERROR_CODES.NOT_YOUR_TURN,
            "It's not your turn"
        )
    end
end

return M
