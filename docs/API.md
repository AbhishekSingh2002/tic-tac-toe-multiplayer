# Tic-Tac-Toe Multiplayer API

## Table of Contents
- [Base URLs](#base-urls)
- [Authentication](#authentication)
- [RPC Endpoints](#rpc-endpoints)
  - [Find Match](#find-match)
  - [Cancel Matchmaking](#cancel-matchmaking)
  - [Make Move](#make-move)
  - [Get Player Stats](#get-player-stats)
  - [Get Leaderboard](#get-leaderboard)
- [WebSocket API](#websocket-api)
  - [Connection](#connection)
  - [Match Events](#match-events)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [SDK Examples](#sdk-examples)

## Base URLs

- **Development**: `http://localhost:7350`
- **Production**: `https://api.yourdomain.com`

## Authentication

All authenticated requests require a session token in the Authorization header:

```
Authorization: Bearer <session_token>
```

### Authenticate with Device

**Endpoint:** `POST /v2/account/authenticate/device`

```http
POST /v2/account/authenticate/device
Authorization: Basic ZGVmYXVsdGtleTo=
Content-Type: application/json

{
  "id": "unique-device-id",
  "create": true,
  "username": "optional-username"
}
```

**Response:**
```json
{
  "token": "jwt-session-token",
  "created": true,
  "user": {
    "id": "user-uuid",
    "username": "username"
  }
}
```

## RPC Endpoints

### Find Match

Start matchmaking to find an opponent.

**Endpoint:** `POST /v2/rpc/find_match`

**Request:**
```json
{}
```

**Response:**
```json
{
  "ticket": "matchmaker-ticket-uuid",
  "message": "Finding match..."
}
```

### Cancel Matchmaking

Cancel an active matchmaking request.

**Endpoint:** `POST /v2/rpc/cancel_matchmaking`

**Request:**
```json
{
  "ticket": "matchmaker-ticket-uuid"
}
```

### Make Move

Submit a move in an active game.

**Endpoint:** `POST /v2/rpc/make_move`

**Request:**
```json
{
  "match_id": "match-uuid",
  "cell_index": 0
}
```

**Response:**
```json
{
  "success": true,
  "state": {
    "board": ["X", "", "", "", "O", "", "", "", ""],
    "next_turn": "X",
    "status": "active"
  },
  "game_status": "continue"
}
```

### Get Player Stats

**Endpoint:** `POST /v2/rpc/get_player_stats`

**Response:**
```json
{
  "wins": 10,
  "losses": 5,
  "draws": 2,
  "rating": 1550
}
```

### Get Leaderboard

**Endpoint:** `POST /v2/rpc/get_leaderboard`

**Request:**
```json
{
  "limit": 50
}
```

**Response:**
```json
[
  {
    "user_id": "user-uuid-1",
    "score": 1800,
    "rank": 1
  }
]
```

## WebSocket API

### Connection

```javascript
const socket = client.createSocket();
await socket.connect(session);
```

### Match Events

#### Match Found
```json
{
  "match_id": "match-uuid",
  "token": "match-token"
}
```

#### Game Update
```json
{
  "type": "game_update",
  "state": {
    "board": ["X", "", "", "", "O", "", "", "", ""],
    "next_turn": "X"
  }
}
```

#### Game Over
```json
{
  "type": "game_over",
  "reason": "win",
  "winner_id": "user-uuid-1"
}
```

## Data Models

### Game State
```typescript
interface GameState {
  board: string[];          // 9 cells: "", "X", or "O"
  player_x_id: string;      // UUID
  player_o_id: string;      // UUID
  next_turn: "X" | "O";
  status: "active" | "finished";
  winner_id: string | null;
  move_history: Move[];
  created_at: number;       // Unix timestamp
  last_updated_at: number;  // Unix timestamp
}
```

### Move
```typescript
interface Move {
  player: "X" | "O";
  cell: number;             // 0-8
  timestamp: number;        // Unix timestamp
}
```

## Error Handling

**Error Response:**
```json
{
  "error": "Invalid move",
  "message": "Cell already occupied",
  "code": 3
}
```

**Common Error Codes:**
- `3`: Invalid argument
- `5`: Not found
- `7`: Permission denied
- `13`: Internal error
- `16`: Unauthenticated

## Rate Limiting

- **Matchmaking**: 20 requests/hour/user
- **Move Submission**: 30 requests/minute/user
- **Leaderboard**: 100 requests/hour/user

## SDK Examples

### JavaScript/TypeScript
```typescript
import { Client } from '@heroiclabs/nakama-js';

const client = new Client('defaultkey', 'localhost', '7350', false);
const session = await client.authenticateDevice('device-id', true);

// Make a move
const response = await client.rpc(
  session,
  'make_move',
  JSON.stringify({ match_id: 'match-id', cell_index: 0 })
);
```

### cURL
```bash
# Make a move
curl -X POST http://localhost:7350/v2/rpc/make_move \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"match_id":"match-id","cell_index":0}'
```
