import React from "react";
import PlayingCard from "./PlayingCard";
import OddsBar from "./OddsBar";

const ACTION_STYLES = {
  call:    { bg: "bg-blue-500/20",   border: "border-blue-400",   label: "CALL" },
  check:   { bg: "bg-green-500/20",  border: "border-green-400",  label: "CHECK" },
  raise:   { bg: "bg-yellow-500/20", border: "border-yellow-400", label: "RAISE" },
  fold:    { bg: "bg-gray-500/20",   border: "border-gray-500",   label: "FOLD" },
  "all-in":{ bg: "bg-red-500/20",    border: "border-red-400",    label: "ALL-IN" },
  waiting: { bg: "",                  border: "border-white/10",   label: "" },
};

/**
 * PlayerSeat — renders a player's position at the table.
 * Props: player object, position ("top"|"bottom"|"left"|"right"), cardSize
 */
const PlayerSeat = ({ player, position = "bottom", cardSize = "md" }) => {
  if (!player) return null;

  const { name, cards = [], winOdds = 0, action = "waiting", bet = 0, isActive = true } = player;
  const style = ACTION_STYLES[action] || ACTION_STYLES.waiting;
  const isFolded = action === "fold" || !isActive;

  return (
    <div
      className={`flex flex-col items-center gap-2 transition-all duration-300 ${isFolded ? "opacity-50" : "opacity-100"}`}
    >
      {/* Cards */}
      <div className="flex gap-1.5">
        {cards.length > 0 ? (
          cards.map((card, i) => (
            <PlayingCard
              key={i}
              rank={card.rank}
              suit={card.suit}
              size={cardSize}
              delay={i * 100}
            />
          ))
        ) : (
          <>
            <PlayingCard faceDown size={cardSize} />
            <PlayingCard faceDown size={cardSize} delay={100} />
          </>
        )}
      </div>

      {/* Name plate */}
      <div
        className={`rounded-lg px-3 py-2 w-full border ${style.bg} ${style.border} transition-all duration-300`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-display text-sm text-white/90 truncate max-w-[100px]">
            {name || `Seat ${player.seat}`}
          </span>
          {action && action !== "waiting" && (
            <span
              className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${style.bg} ${
                isFolded ? "text-gray-500" : "text-white"
              }`}
            >
              {style.label}
            </span>
          )}
        </div>

        {bet > 0 && !isFolded && (
          <div className="text-xs text-gold-300 font-mono mb-1">Bet: ${bet}</div>
        )}

        <OddsBar odds={winOdds} isActive={isActive} isFolded={isFolded} />
      </div>
    </div>
  );
};

export default PlayerSeat;
