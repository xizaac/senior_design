const mongoose = require("mongoose");

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const CardSchema = new mongoose.Schema(
  {
    rank: { type: String, required: true }, // "A","2"..."K"
    suit: { type: String, required: true }, // "hearts","diamonds","clubs","spades"
  },
  { _id: false }
);

const PlayerSchema = new mongoose.Schema(
  {
    seat: { type: Number, required: true },        // 1–4
    name: { type: String, default: "" },
    cards: { type: [CardSchema], default: [] },    // 2 hole cards
    winOdds: { type: Number, default: 0 },         // 0–100 percentage
    action: {
      type: String,
      enum: ["waiting", "call", "check", "raise", "fold", "all-in", ""],
      default: "waiting",
    },
    bet: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },    // false = folded
  },
  { _id: false }
);

// ── Main Session Schema ───────────────────────────────────────────────────────

const SessionSchema = new mongoose.Schema(
  {
    sessionCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["waiting", "active", "ended"],
      default: "waiting",
    },
    phase: {
      type: String,
      enum: ["pre-flop", "flop", "turn", "river", "showdown", "idle"],
      default: "idle",
    },
    players: { type: [PlayerSchema], default: [] },
    communityCards: { type: [CardSchema], default: [] }, // up to 5
    pot: { type: Number, default: 0 },
    currentBet: { type: Number, default: 0 },
    activePlayerSeat: { type: Number, default: 1 },      // whose turn it is
    dealerSeat: { type: Number, default: 1 },
    spectatorCount: { type: Number, default: 0 },
    lastEsp32Update: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", SessionSchema);
