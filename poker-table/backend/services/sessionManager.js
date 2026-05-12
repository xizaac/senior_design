const Session = require("../models/Session");

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Generates a random 6-character alphanumeric session code.
 */
const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusable chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

/**
 * Returns the single active session, or null.
 */
const getActiveSession = async () => {
  return Session.findOne({ status: { $in: ["waiting", "active"] } });
};

/**
 * Creates a fresh session with 4 player slots.
 * Throws if a session is already active.
 */
const createSession = async (playerNames = []) => {
  const existing = await getActiveSession();
  if (existing) {
    throw new Error("TABLE_IN_USE");
  }

  let code;
  let attempts = 0;
  // Ensure unique code (virtually guaranteed on first try)
  while (attempts < 10) {
    code = generateCode();
    const collision = await Session.findOne({ sessionCode: code });
    if (!collision) break;
    attempts++;
  }

  const players = Array.from({ length: 4 }, (_, i) => ({
    seat: i + 1,
    name: playerNames[i] || `Player ${i + 1}`,
    cards: [],
    winOdds: 0,
    action: "waiting",
    bet: 0,
    isActive: true,
  }));

  const session = new Session({ sessionCode: code, players, status: "waiting" });
  await session.save();
  return session;
};

/**
 * Applies a dealer bet action to a player in the active session.
 */
const applyBetAction = async (sessionCode, seat, action, raiseAmount = 0) => {
  const session = await Session.findOne({ sessionCode });
  if (!session) throw new Error("SESSION_NOT_FOUND");

  const player = session.players.find((p) => p.seat === seat);
  if (!player) throw new Error("PLAYER_NOT_FOUND");

  player.action = action;

  if (action === "fold") {
    player.isActive = false;
  }

  if (action === "call") {
    player.bet = session.currentBet;
  }

  if (action === "raise") {
    const newBet = session.currentBet + raiseAmount;
    session.currentBet = newBet;
    player.bet = newBet;
  }

  if (action === "all-in") {
    player.action = "all-in";
  }

  // Update pot
  session.pot = session.players.reduce((sum, p) => sum + (p.bet || 0), 0);

  await session.save();
  return session;
};

/**
 * Ends the current session.
 */
const endSession = async (sessionCode) => {
  const session = await Session.findOne({ sessionCode });
  if (!session) throw new Error("SESSION_NOT_FOUND");
  session.status = "ended";
  await session.save();
  return session;
};

module.exports = { createSession, getActiveSession, applyBetAction, endSession };
