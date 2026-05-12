import React from "react";
import PlayerSeat from "./PlayerSeat";
import PlayingCard from "./PlayingCard";

const PHASE_LABELS = {
  idle: "Waiting to start",
  "pre-flop": "Pre-Flop",
  flop: "Flop",
  turn: "Turn",
  river: "River",
  showdown: "Showdown",
};

/**
 * PokerTable — the main felt table layout.
 * Shows 4 player seats (top, bottom, left, right) and community cards in center.
 * Props: gameState (session object)
 */
const PokerTable = ({ gameState }) => {
  if (!gameState) return null;

  const { players = [], communityCards = [], pot = 0, phase = "idle", currentBet = 0 } = gameState;

  // Seat positions
  const [p1, p2, p3, p4] = [
    players.find((p) => p.seat === 1),
    players.find((p) => p.seat === 2),
    players.find((p) => p.seat === 3),
    players.find((p) => p.seat === 4),
  ];

  return (
    <div className="relative w-full flex flex-col items-center gap-4 py-4">
      {/* Player 1 — top */}
      <div className="w-full flex justify-center">
        <div className="w-48">
          <PlayerSeat player={p1} position="top" cardSize="sm" />
        </div>
      </div>

      {/* Middle row: Player 3 (left) | Table | Player 4 (right) */}
      <div className="w-full flex items-center justify-between gap-4 px-2">
        {/* Player 3 */}
        <div className="w-44 flex-shrink-0">
          <PlayerSeat player={p3} position="left" cardSize="sm" />
        </div>

        {/* ── Felt Table ─────────────────────────────────────────────────── */}
        <div
          className="flex-1 relative rounded-[120px] flex flex-col items-center justify-center py-8 px-6 min-h-[200px]"
          style={{
            background: "radial-gradient(ellipse at 50% 40%, #164a36 0%, #0d2d20 60%, #0a2218 100%)",
            boxShadow:
              "inset 0 0 60px rgba(0,0,0,0.5), 0 0 0 10px #2c1a0e, 0 0 0 14px #1a0f07, 0 8px 32px rgba(0,0,0,0.6)",
          }}
        >
          {/* Table rail highlight */}
          <div
            className="absolute inset-0 rounded-[120px] pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 40%)",
            }}
          />

          {/* Phase badge */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-widest uppercase"
            style={{
              background: "rgba(212,168,67,0.15)",
              border: "1px solid rgba(212,168,67,0.3)",
              color: "#d4a843",
            }}
          >
            {PHASE_LABELS[phase] || phase}
          </div>

          {/* Community cards */}
          <div className="flex gap-2 items-center justify-center mt-4">
            {Array.from({ length: 5 }, (_, i) => {
              const card = communityCards[i];
              return (
                <PlayingCard
                  key={i}
                  rank={card?.rank}
                  suit={card?.suit}
                  faceDown={false}
                  size="md"
                  delay={i * 80}
                />
              );
            })}
          </div>

          {/* Pot */}
          <div className="mt-4 flex flex-col items-center gap-1">
            <span className="text-xs text-white/40 font-body uppercase tracking-widest">
              Pot
            </span>
            <span className="text-xl font-display font-bold" style={{ color: "#d4a843" }}>
              ${pot.toLocaleString()}
            </span>
            {currentBet > 0 && (
              <span className="text-xs text-white/50 font-mono">
                Current bet: ${currentBet}
              </span>
            )}
          </div>
        </div>
        {/* ── End Felt Table ─────────────────────────────────────────────── */}

        {/* Player 4 */}
        <div className="w-44 flex-shrink-0">
          <PlayerSeat player={p4} position="right" cardSize="sm" />
        </div>
      </div>

      {/* Player 2 — bottom */}
      <div className="w-full flex justify-center">
        <div className="w-48">
          <PlayerSeat player={p2} position="bottom" cardSize="sm" />
        </div>
      </div>
    </div>
  );
};

export default PokerTable;
