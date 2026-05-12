# ♠ Smart Poker Table

RFID-powered live poker tracking system with a real-time web interface.

## Architecture

```
[RFID Sensors]
      ↓
[ESP32-WROOM-32]  ── HTTP POST ──→  [Backend API (Node.js + Express)]
  card detection                           ↓              ↓
  odds computing                      MongoDB       WebSocket (Socket.io)
                                                         ↓
                                              [Frontend (React + Vite)]
                                            Dealer View | Spectator View
```

## Project Structure

```
poker-table/
├── esp32/               # Arduino firmware for the ESP32
│   └── poker_table.ino
├── backend/             # Node.js API server
│   ├── server.js        # Entry point
│   ├── routes/
│   │   ├── game.js      # Session create/join/bet actions
│   │   └── esp32.js     # ESP32 data ingestion endpoint
│   ├── models/
│   │   └── Session.js   # MongoDB schema
│   ├── services/
│   │   ├── db.js        # MongoDB connection
│   │   └── sessionManager.js
│   └── sockets/
│       └── gameSocket.js
└── frontend/            # React app
    └── src/
        ├── pages/
        │   ├── Home.jsx          # Create or join session
        │   ├── DealerView.jsx    # Full control panel
        │   └── SpectatorView.jsx # Read-only live view
        ├── components/
        │   ├── PokerTable.jsx    # Main table layout
        │   ├── PlayerSeat.jsx    # Cards + odds per player
        │   ├── PlayingCard.jsx   # Card face renderer
        │   ├── BetControls.jsx   # Call/Check/Raise/Fold buttons
        │   ├── OddsBar.jsx       # Win probability bar
        │   └── SessionCodeDisplay.jsx
        ├── hooks/
        │   ├── useSocket.js      # WebSocket singleton
        │   └── useGameState.js   # Live state subscription
        └── api.js                # Axios API calls
```

## Quick Start (Local Development)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — paste your MongoDB URI and set ESP32_API_KEY
npm install
npm run dev
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:3001 (default)
npm install
npm run dev
```

Open http://localhost:5173

### 3. ESP32

1. Open `esp32/poker_table.ino` in Arduino IDE
2. Set `WIFI_SSID`, `WIFI_PASSWORD`, `BACKEND_URL`, and `API_KEY`
3. Flash to your ESP32-WROOM-32
4. After creating a session on the website, update `SESSION_CODE` and reflash (or implement dynamic session code input on the device)

## API Reference

### Game Routes (Frontend → Backend)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/api/game/status` | — | Check if table is available |
| POST | `/api/game/create` | `{ playerNames[] }` | Create a new session |
| GET | `/api/game/join/:code` | — | Join/verify a session |
| POST | `/api/game/action` | `{ sessionCode, seat, action, raiseAmount? }` | Submit bet action |
| POST | `/api/game/phase` | `{ sessionCode, phase }` | Advance game phase |
| POST | `/api/game/end` | `{ sessionCode }` | End the session |

### ESP32 Routes (Hardware → Backend)

| Method | Endpoint | Headers | Description |
|--------|----------|---------|-------------|
| POST | `/api/esp32/update` | `x-api-key` | Push card + odds data |
| GET | `/api/esp32/ping` | `x-api-key` | Verify connectivity |

### ESP32 Payload Format

```json
{
  "sessionCode": "ABC123",
  "phase": "flop",
  "players": [
    {
      "seat": 1,
      "cards": [
        { "rank": "A", "suit": "spades" },
        { "rank": "K", "suit": "hearts" }
      ],
      "winOdds": 67.4
    }
  ],
  "communityCards": [
    { "rank": "7", "suit": "clubs" },
    { "rank": "J", "suit": "diamonds" },
    { "rank": "2", "suit": "spades" }
  ]
}
```

Valid ranks: `"A","2","3","4","5","6","7","8","9","10","J","Q","K"`  
Valid suits: `"hearts","diamonds","clubs","spades"`

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `session:join` | Client → Server | `{ sessionCode }` |
| `game:stateUpdate` | Server → Client | Full session object |
| `game:ended` | Server → Client | `{ sessionCode }` |
| `spectator:count` | Server → Client | `{ count }` |

## Deployment (Railway)

1. Create a Railway project
2. Add a MongoDB plugin
3. Deploy backend from `/backend` — set env vars from `.env.example`
4. Deploy frontend from `/frontend` — set `VITE_API_URL` to your backend URL
5. Update ESP32 firmware with the backend's public URL

## Session Limit

Only **one active session** is allowed at a time (since there is one physical table).  
Creating a new session while one is active returns HTTP 409.
