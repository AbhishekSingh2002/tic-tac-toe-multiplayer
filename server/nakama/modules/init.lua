-- server/nakama/modules/init.lua
local nk = require("nakama")

nk.logger_info("Initializing Tic-Tac-Toe match handler...")

-- Safely require the tic_tac_toe module
local ok, tic_tac_toe = pcall(require, "game_logic.tic_tac_toe")
if not ok or type(tic_tac_toe) ~= "table" then
  nk.logger_error("Failed to load game_logic.tic_tac_toe: " .. tostring(tic_tac_toe))
  return {}
end

-- Log type of the returned module
nk.logger_info("game_logic.tic_tac_toe type: " .. tostring(type(tic_tac_toe)))

-- Validate required functions exist and are functions
local required = {
  "match_init",
  "match_join_attempt",
  "match_join",
  "match_leave",
  "match_loop",
  "match_terminate",
  "match_signal"
}

for _, name in ipairs(required) do
  nk.logger_info("Checking: " .. name .. " -> " .. tostring(type(tic_tac_toe[name])))
  if type(tic_tac_toe[name]) ~= "function" then
    nk.logger_error("Module game_logic.tic_tac_toe is missing required function: " .. name)
    return {}
  end
end

-- Create and return the match handler for Nakama to register
local match_handler = {
  match_init = tic_tac_toe.match_init,
  match_join_attempt = tic_tac_toe.match_join_attempt,
  match_join = tic_tac_toe.match_join,
  match_leave = tic_tac_toe.match_leave,
  match_loop = tic_tac_toe.match_loop,
  match_terminate = tic_tac_toe.match_terminate,
  match_signal = tic_tac_toe.match_signal
}

-- Try to load matchmaking module
local mm_ok, _ = pcall(require, "matchmaking.matchmaker")
if not mm_ok then
  nk.logger_warn("Matchmaking module not found, continuing without it")
else
  nk.logger_info("Matchmaking module loaded")
end

nk.logger_info("Tic-Tac-Toe match handler registered successfully")

-- Return the module table with the match handler
return {
  tic_tac_toe = match_handler
}