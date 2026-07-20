import React from "react";
import PlayerSeat from "./PlayerSeat";
import PlayingCard from "./PlayingCard";
import BetControls from "./BetControls";
import ScaleToWidth from "./ScaleToWidth";
import { PHASE_LABELS, CORNER_WIDTH } from "./PokerTable";

const PHASES = ["pre-flop", "flop", "turn", "river", "showdown"];

/**
 * MobileDealerPanel — phone-width replacement for the corner-table layout
 * (PokerTable + separate sidebar), which doesn't have room to stay legible
 * on a narrow screen: the felt shrinks to a sliver while the corner boxes
 * still eat most of the height, and controls end up scrolled far below the
 * cards they refer to. Instead, each player's cards/stack/odds (via the
 * existing PlayerSeat, scaled to the phone's width with ScaleToWidth) sit
 * directly above that same player's bet controls, so everything relevant
 * to one decision is in one place. Used only below the `sm` breakpoint —
 * the desktop/tablet corner layout is untouched at `sm` and above.
 */
const MobileDealerPanel = ({
  session,
  sessionCode,
  setGameState,
  handleResetPlayer,
  setBuybackSeat,
  handleUndo,
  undoLoading,
  handleNextPhase,
  phaseLoading,
  nextPhase,
  winningSeat,
  setWinningSeat,
  handleNextHand,
  nextHandLoading,
  error,
}) => {
  const { players = [], communityCards = [], pot = 0, phase = "idle", activePlayerSeat, buttonSeat, smallBlindSeat, bigBlindSeat } = session;

  const getRole = (seat) => {
    if (seat === buttonSeat) return "dealer";
    if (seat === smallBlindSeat) return "small-blind";
    if (seat === bigBlindSeat) return "big-blind";
    return null;
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Compact phase / community cards / pot strip */}
      <div
        className="rounded-xl p-3 flex items-center justify-between gap-2 flex-wrap"
        style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <span
          className="text-xs font-mono font-semibold tracking-widest uppercase px-2 py-1 rounded-full"
          style={{ background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.3)", color: "#d4a843" }}
        >
          {PHASE_LABELS[phase] || phase}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => {
            const card = communityCards[i];
            return <PlayingCard key={i} rank={card?.rank} suit={card?.suit} size="sm" />;
          })}
        </div>
        <div className="text-right">
          <div className="text-[10px] text-white/40 uppercase tracking-widest leading-none">Pot</div>
          <div className="font-display font-bold text-lg" style={{ color: "#d4a843" }}>
            ${pot.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Undo */}
      <button
        onClick={handleUndo}
        disabled={undoLoading || !session.actionHistory?.length}
        className="w-full text-xs py-2 rounded-lg font-semibold transition-all disabled:opacity-40"
        style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", color: "#d4a843" }}
      >
        {undoLoading ? "Undoing..." : "↶ Undo Last Action"}
      </button>

      {/* Per-player: cards/stack/odds + that player's controls, together */}
      {players.map((player) => (
        <div
          key={player.seat}
          className="rounded-xl p-2 space-y-2"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <ScaleToWidth naturalWidth={CORNER_WIDTH}>
            <PlayerSeat
              player={player}
              cardSize="lg"
              isActiveTurn={player.seat === activePlayerSeat}
              role={getRole(player.seat)}
            />
          </ScaleToWidth>

          <BetControls
            player={player}
            sessionCode={sessionCode}
            onUpdate={setGameState}
            isActiveTurn={player.seat === activePlayerSeat}
            currentBet={session.currentBet}
            players={players}
          />

          {player.chipCount === 0 && player.bet === 0 && (
            <button
              onClick={() => setBuybackSeat(player.seat)}
              className="w-full text-xs py-1 rounded text-red-400 hover:text-red-300 transition-colors"
            >
              💰 Buy Back
            </button>
          )}
          {player.chipCount > 0 && (player.action === "fold" || !player.isActive) && (
            <button
              onClick={() => handleResetPlayer(player.seat)}
              className="w-full text-xs py-1 rounded text-white/30 hover:text-white/60 transition-colors"
            >
              ↺ Reset player
            </button>
          )}
        </div>
      ))}

      {/* Phase controls */}
      <div
        className="rounded-xl p-3 flex flex-col gap-2"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="text-xs text-white/40 uppercase tracking-widest font-semibold">Game Phase</div>
        <div className="flex gap-1 flex-wrap">
          {PHASES.map((p) => (
            <span
              key={p}
              className="text-xs px-2 py-0.5 rounded font-mono"
              style={{
                background: phase === p ? "rgba(212,168,67,0.25)" : "rgba(255,255,255,0.05)",
                color: phase === p ? "#d4a843" : "rgba(255,255,255,0.3)",
                border: `1px solid ${phase === p ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {p}
            </span>
          ))}
        </div>
        {nextPhase && (
          <button
            onClick={handleNextPhase}
            disabled={phaseLoading}
            className="w-full px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #d4a843, #e8c46a)", color: "#1a0f07" }}
          >
            {phaseLoading ? "..." : `→ ${nextPhase.charAt(0).toUpperCase() + nextPhase.slice(1)}`}
          </button>
        )}
      </div>

      {/* Next hand */}
      {phase === "showdown" && (
        <div
          className="rounded-xl p-3 space-y-2"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <label className="text-xs text-white/40 uppercase tracking-widest font-semibold">
            Next Hand - Choose Winner
          </label>
          <select
            value={winningSeat || ""}
            onChange={(e) => setWinningSeat(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-400"
          >
            <option value="">Select winning player...</option>
            {players.map((p) => (
              <option key={p.seat} value={p.seat}>
                Seat {p.seat} - {p.name} (Stack: ${p.chipCount})
              </option>
            ))}
          </select>
          <button
            onClick={handleNextHand}
            disabled={nextHandLoading || !winningSeat}
            className="w-full py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #d4a843, #e8c46a)", color: "#1a0f07" }}
          >
            {nextHandLoading ? "Starting..." : "Start Next Hand"}
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
    </div>
  );
};

export default MobileDealerPanel;
