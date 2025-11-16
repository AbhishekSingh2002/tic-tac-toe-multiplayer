-- debug_nk.lua
local nk = require("nakama")

local function list_functions(t, prefix)
  local result = {}
  for k, v in pairs(t) do
    table.insert(result, string.format("%s (%s)", k, type(v)))
  end
  table.sort(result)
  return table.concat(result, "\n")
end

local function rpc_dump_nk(context, payload)
  local result = {
    ok = true,
    functions = list_functions(nk, "nk")
  }
  
  -- Also check for specific matchmaker functions
  result.matchmaker_add_type = type(nk.matchmaker_add)
  result.matchmaker_add_value = tostring(nk.matchmaker_add)
  result.matchmaker_add_player_type = type(nk.matchmaker_add_player)
  result.matchmaker_add_player_value = tostring(nk.matchmaker_add_player)
  
  return nk.json_encode(result)
end

nk.register_rpc(rpc_dump_nk, "dump_nk")
return {}
