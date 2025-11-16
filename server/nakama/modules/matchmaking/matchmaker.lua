-- matchmaker.lua
local nk = require("nakama")

-- Helper: safe call to log & return JSON error
local function json_error(msg)
  nk.logger_error(msg)
  return nk.json_encode({ success = false, error = msg })
end

-- In-memory storage for matchmaking queue
local matchmaking_queue = {}

-- RPC: Find match
local function rpc_find_match(context, payload)
  if not context or not context.user_id then
    return json_error("Invalid context or missing user_id")
  end

  local player_id = context.user_id
  nk.logger_info(string.format("Player %s is looking for a match", player_id))

  -- Add player to matchmaking queue
  table.insert(matchmaking_queue, player_id)
  nk.logger_info(string.format("Player %s added to matchmaking queue. Queue size: %d", 
    player_id, #matchmaking_queue))

  -- If we have at least 2 players, create a match
  if #matchmaking_queue >= 2 then
    local player1 = table.remove(matchmaking_queue, 1)
    local player2 = table.remove(matchmaking_queue, 1)
    
    nk.logger_info(string.format("Creating match between %s and %s", player1, player2))
    
    -- Create a new match
    local match_id = nk.uuid_v4()
    local now = os.time()
    
    -- Save match info to storage
    local ok, err = pcall(function()
      nk.storage_write({
        {
          collection = "matches",
          key = match_id,
          value = {
            player1 = player1,
            player2 = player2,
            status = "waiting",
            created_at = now
          },
          permission_read = 1,
          permission_write = 0
        }
      })
    end)
    
    if not ok then
      return json_error("Failed to create match: " .. tostring(err))
    end
    
    -- Create the actual match with proper player information
    local match_params = {
      match_id = match_id,
      player_x_id = player_x_id,
      player_o_id = player_o_id,
      player_x_username = player_x_username,
      player_o_username = player_o_username
    }
    
    local match_created, match_err = pcall(function()
      return nk.match_create("game_logic.tic_tac_toe", match_params)
    end)
    
    if not match_created then
      return json_error("Failed to create match: " .. tostring(match_err))
    end
    
    return nk.json_encode({
      success = true,
      message = "Match created successfully",
      match_id = match_id,
      opponent = player1 == player_id and player2 or player1
    })
  else
    return nk.json_encode({
      success = true,
      message = "Waiting for an opponent...",
      queue_position = #matchmaking_queue
    })
  end
end

-- RPC: Cancel matchmaking
local function rpc_cancel_matchmaking(context, payload)
  local json = nil
  if payload and payload ~= "" then
    json = nk.json_decode(payload)
  else
    json = {}
  end

  local ticket = json and json.ticket
  if not ticket or ticket == "" then
    return json_error("Ticket is required to cancel matchmaking")
  end

  if type(nk.matchmaker_remove) ~= "function" then
    return json_error("Server runtime does not expose matchmaker_remove")
  end

  local ok, err = pcall(function() nk.matchmaker_remove(ticket) end)
  if not ok then
    return json_error("Failed to remove matchmaker ticket: " .. tostring(err))
  end

  return nk.json_encode({ success = true, message = "Matchmaking cancelled" })
end

-- Matchmaker matched callback
local function matchmaker_matched(context, matched_users)
  nk.logger_info("matchmaker_matched called, matched_users count: " .. tostring(#matched_users))

  if #matched_users ~= 2 then
    nk.logger_info("Ignoring matched group of size " .. tostring(#matched_users))
    return nil
  end

  local p1 = matched_users[1]
  local p2 = matched_users[2]

  if not p1.presence or not p2.presence then
    nk.logger_error("Matched user presence missing")
    return nil
  end

  local player_x_id, player_o_id, player_x_username, player_o_username
  if math.random() < 0.5 then
    player_x_id = p1.presence.user_id
    player_o_id = p2.presence.user_id
    player_x_username = p1.properties.username or p1.presence.username or "Player X"
    player_o_username = p2.properties.username or p2.presence.username or "Player O"
  else
    player_x_id = p2.presence.user_id
    player_o_id = p1.presence.user_id
    player_x_username = p2.properties.username or p2.presence.username or "Player X"
    player_o_username = p1.properties.username or p1.presence.username or "Player O"
  end

  local match_id = nk.uuid_v4()
  local now = os.time()
  local game_state = {
    board = {"", "", "", "", "", "", "", "", ""},
    player_x_id = player_x_id,
    player_o_id = player_o_id,
    next_turn = "X",
    status = "active",
    winner_id = nil,
    move_history = {},
    created_at = now,
    last_updated_at = now
  }

  local write = {{
    collection = "matches",
    key = match_id,
    user_id = nil,
    value = game_state,
    permission_read = 1,
    permission_write = 0
  }}
  local ok, err = pcall(function() nk.storage_write(write) end)
  if not ok then
    nk.logger_error("storage_write failed: " .. tostring(err))
  end

  local params = { match_id = match_id, player_x_id = player_x_id, player_o_id = player_o_id }
  local created_match_id = nil
  local ok2, err2 = pcall(function() created_match_id = nk.match_create("game_logic.tic_tac_toe", params) end)
  if not ok2 then
    nk.logger_error("match_create failed: " .. tostring(err2))
    return nil
  end

  nk.logger_info("Created authoritative match: " .. tostring(created_match_id) .. " for match_id: " .. tostring(match_id))
  return created_match_id
end

-- Register callbacks & RPCs
if type(nk.register_matchmaker_matched) == "function" then
  nk.register_matchmaker_matched(matchmaker_matched)
else
  nk.logger_error("register_matchmaker_matched is not available (type: " .. tostring(type(nk.register_matchmaker_matched)) .. ")")
end

nk.register_rpc(rpc_find_match, "find_match")
nk.register_rpc(rpc_cancel_matchmaking, "cancel_matchmaking")

return {
  rpc_find_match = rpc_find_match,
  rpc_cancel_matchmaking = rpc_cancel_matchmaking,
  matchmaker_matched = matchmaker_matched
}
