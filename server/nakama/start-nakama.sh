#!/bin/sh

# Start Nakama with the correct database configuration
/nakama/nakama \
  --name tic-tac-toe-server \
  --database.address postgres:5432 \
  --database.username nakama \
  --database.password nakama_password \
  --database.name nakama \
  --database.schema public \
  --socket.server_key defaultkey \
  --socket.host 0.0.0.0 \
  --socket.port 7350 \
  --console.address 0.0.0.0 \
  --console.port 7351 \
  --console.username admin \
  --console.password password \
  --runtime.path /nakama/data/modules \
  --runtime.lua.entrypoint main.lua \
  --runtime.js_entrypoint main.js
