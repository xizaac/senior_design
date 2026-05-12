const express = require("express");
const router = express.Router();
const {
  createSession,
  getActiveSession,
  applyBetAction,
  endSession,
} = require("../services/sessionManager");

// ── GET /api/game/status ──────────────────────────────────────────────────────
// Check if table is in use and get current session info
router.get("/status", async (req, res) => {
  try {
    const session = await getActiveSession();
    if (!session) {
      return res.json({ tableAvailable: true, session: null });
    }
    return res.json({ tableAvailable: false, session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/game/create ─────────────────────────────────────────────────────
// Dealer creates a new session
// Body: { playerNames: ["Alice", "Bob", "Charlie", "Dana"] }
router.post("/create", async (req, res) => {
  try {
    const { playerNames } = req.body;
    const session = await createSession(playerNames || []);
    const io = req.app.get("io");
    io.emit("session:created", session);
    res.status(201).json({ success: true, session });
  } catch (err) {
    if (err.message === "TABLE_IN_USE") {
      return res.status(409).json({
        error: "TABLE_IN_USE",
        message: "A session is already active. Only one table is supported.",
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/game/join/:code ──────────────────────────────────────────────────
// Spectator joins session by code
router.get("/join/:code", async (req, res) => {
  try {
    const Session = require("../models/Session");
    const session = await Session.findOne({
      sessionCode: req.params.code.toUpperCase(),
      status: { $in: ["waiting", "active"] },
    });
    if (!session) {
      return res.status(404).json({ error: "SESSION_NOT_FOUND", message: "No active session with that code." });
    }
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/game/action ─────────────────────────────────────────────────────
// Dealer submits a bet action
// Body: { sessionCode, seat, action, raiseAmount? }
router.post("/action", async (req, res) => {
  try {
    const { sessionCode, seat, action, raiseAmount } = req.body;
    if (!sessionCode || !seat || !action) {
      return res.status(400).json({ error: "Missing required fields: sessionCode, seat, action" });
    }

    const session = await applyBetAction(sessionCode, Number(seat), action, Number(raiseAmount) || 0);
    const io = req.app.get("io");
    io.to(sessionCode).emit("game:stateUpdate", session);
    res.json({ success: true, session });
  } catch (err) {
    if (err.message === "SESSION_NOT_FOUND") return res.status(404).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/game/phase ──────────────────────────────────────────────────────
// Dealer advances game phase (pre-flop → flop → turn → river → showdown)
// Body: { sessionCode, phase }
router.post("/phase", async (req, res) => {
  try {
    const { sessionCode, phase } = req.body;
    const Session = require("../models/Session");
    const session = await Session.findOne({ sessionCode });
    if (!session) return res.status(404).json({ error: "SESSION_NOT_FOUND" });

    session.phase = phase;
    session.status = "active";

    // Reset per-round bet tracking on new phase
    if (["flop", "turn", "river"].includes(phase)) {
      session.players.forEach((p) => {
        if (p.isActive) p.action = "waiting";
      });
      session.currentBet = 0;
    }

    await session.save();
    const io = req.app.get("io");
    io.to(sessionCode).emit("game:stateUpdate", session);
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/game/end ────────────────────────────────────────────────────────
// Dealer ends the session
// Body: { sessionCode }
router.post("/end", async (req, res) => {
  try {
    const { sessionCode } = req.body;
    const session = await endSession(sessionCode);
    const io = req.app.get("io");
    io.to(sessionCode).emit("game:ended", { sessionCode });
    io.emit("session:ended", { sessionCode });
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/game/reset-player ───────────────────────────────────────────────
// Reset a player's action/bet for a new round
// Body: { sessionCode, seat }
router.post("/reset-player", async (req, res) => {
  try {
    const { sessionCode, seat } = req.body;
    const Session = require("../models/Session");
    const session = await Session.findOne({ sessionCode });
    if (!session) return res.status(404).json({ error: "SESSION_NOT_FOUND" });

    const player = session.players.find((p) => p.seat === Number(seat));
    if (player) {
      player.action = "waiting";
      player.bet = 0;
      player.isActive = true;
    }
    await session.save();
    const io = req.app.get("io");
    io.to(sessionCode).emit("game:stateUpdate", session);
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
