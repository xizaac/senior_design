const express = require("express");
const router = express.Router();
const Session = require("../models/Session");

// ── Middleware: validate ESP32 API key ────────────────────────────────────────
const validateApiKey = (req, res, next) => {
  const key = req.headers["x-api-key"];
  if (!key || key !== process.env.ESP32_API_KEY) {
    return res.status(401).json({ error: "Unauthorized: invalid API key" });
  }
  next();
};

// ── POST /api/esp32/update ────────────────────────────────────────────────────
/**
 * Main endpoint the ESP32 calls every time game state changes.
 *
 * Expected payload:
 * {
 *   "sessionCode": "ABC123",         // must match active session
 *   "phase": "flop",                 // optional phase override
 *   "players": [
 *     {
 *       "seat": 1,
 *       "cards": [
 *         { "rank": "A", "suit": "spades" },
 *         { "rank": "K", "suit": "hearts" }
 *       ],
 *       "winOdds": 67.4
 *     },
 *     ...
 *   ],
 *   "communityCards": [
 *     { "rank": "7", "suit": "clubs" },
 *     { "rank": "J", "suit": "diamonds" },
 *     { "rank": "2", "suit": "spades" }
 *   ]
 * }
 */
router.post("/update", validateApiKey, async (req, res) => {
  try {
    const { sessionCode, players, communityCards, phase } = req.body;

    if (!sessionCode) {
      return res.status(400).json({ error: "sessionCode is required" });
    }

    const session = await Session.findOne({
      sessionCode: sessionCode.toUpperCase(),
      status: { $in: ["waiting", "active"] },
    });

    if (!session) {
      return res.status(404).json({
        error: "SESSION_NOT_FOUND",
        message: "No active session with that code",
      });
    }

    // Update community cards
    if (Array.isArray(communityCards)) {
      session.communityCards = communityCards.slice(0, 5);
    }

    // Update player cards + odds from ESP32 data
    if (Array.isArray(players)) {
      players.forEach((esp32Player) => {
        const player = session.players.find((p) => p.seat === esp32Player.seat);
        if (player) {
          if (Array.isArray(esp32Player.cards)) {
            player.cards = esp32Player.cards.slice(0, 2);
          }
          if (typeof esp32Player.winOdds === "number") {
            player.winOdds = Math.min(100, Math.max(0, esp32Player.winOdds));
          }
        }
      });
    }

    // Optionally update phase
    if (phase) {
      session.phase = phase;
      session.status = "active";
    }

    session.lastEsp32Update = new Date();
    await session.save();

    // Broadcast to all connected clients in this session's room
    const io = req.app.get("io");
    io.to(session.sessionCode).emit("game:stateUpdate", session);

    res.json({ success: true, updated: new Date().toISOString() });
  } catch (err) {
    console.error("ESP32 update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/esp32/ping ───────────────────────────────────────────────────────
// ESP32 can call this to verify connectivity before a game
router.get("/ping", validateApiKey, (req, res) => {
  res.json({ status: "online", timestamp: new Date().toISOString() });
});

module.exports = router;
