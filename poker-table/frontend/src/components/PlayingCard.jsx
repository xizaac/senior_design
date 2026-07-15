import React from "react";

// Maps suit names to symbols and colors
const SUIT_MAP = {
  hearts:   { symbol: "♥", color: "#c0392b", short: "H" },
  diamonds: { symbol: "♦", color: "#c0392b", short: "D" },
  clubs:    { symbol: "♣", color: "#1a1a1a", short: "C" },
  spades:   { symbol: "♠", color: "#1a1a1a", short: "S" },
};

// Display rank (10 stays as 10, others as-is)
const displayRank = (rank) => {
  if (rank === "10") return "10";
  return rank;
};

/**
 * PlayingCard — renders a realistic card face.
 * Props:
 *   rank: "A"|"2"..."K"
 *   suit: "hearts"|"diamonds"|"clubs"|"spades"
 *   faceDown: bool (show card back)
 *   size: "sm"|"md"|"lg"
 *   delay: number (animation delay in ms)
 */
const PlayingCard = ({ rank, suit, faceDown = false, size = "md", delay = 0 }) => {
  const sizeClasses = {
    sm: "w-10 h-14",
    md: "w-14 h-20",
    lg: "w-20 h-28",
    xl: "w-28 h-40",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-xl",
  };

  const centerSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl",
  };

  if (faceDown) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-md shadow-card flex items-center justify-center relative overflow-hidden animate-deal`}
        style={{
          background: "linear-gradient(135deg, #1a237e 0%, #283593 50%, #1a237e 100%)",
          border: "1.5px solid rgba(255,255,255,0.15)",
          animationDelay: `${delay}ms`,
        }}
      >
        {/* Back pattern */}
        <div
          className="absolute inset-1 rounded opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 1px, transparent 1px, transparent 8px)",
          }}
        />
        <div className="text-white/20 text-xl">🂠</div>
      </div>
    );
  }

  if (!rank || !suit) {
    // Empty placeholder
    return (
      <div
        className={`${sizeClasses[size]} rounded-md border-2 border-dashed border-white/10 flex items-center justify-center`}
      >
        <span className="text-white/20 text-xs">?</span>
      </div>
    );
  }

  const suitInfo = SUIT_MAP[suit.toLowerCase()] || SUIT_MAP.spades;
  const r = displayRank(rank);

  return (
    <div
      className={`${sizeClasses[size]} rounded-md bg-white shadow-card relative flex flex-col items-center justify-between p-1 overflow-hidden animate-deal select-none`}
      style={{
        border: "1.5px solid rgba(0,0,0,0.12)",
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Top-left corner — rank + suit on one line so it never outgrows the card */}
      <div
        className={`self-start flex items-center gap-0.5 leading-none ${textSizes[size]} font-bold font-mono`}
        style={{ color: suitInfo.color }}
      >
        <span>{r}</span>
        <span>{suitInfo.symbol}</span>
      </div>

      {/* Center suit */}
      <div
        className={`${centerSizes[size]} leading-none`}
        style={{ color: suitInfo.color }}
      >
        {suitInfo.symbol}
      </div>

      {/* Bottom-right corner (rotated) */}
      <div
        className={`self-end flex items-center gap-0.5 leading-none ${textSizes[size]} font-bold font-mono rotate-180`}
        style={{ color: suitInfo.color }}
      >
        <span>{r}</span>
        <span>{suitInfo.symbol}</span>
      </div>
    </div>
  );
};

export default PlayingCard;
