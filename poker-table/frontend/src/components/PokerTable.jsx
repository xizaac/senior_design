import React, { useLayoutEffect, useRef, useState } from "react";
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

// Reference size the felt table's contents (phase badge, cards, pot) are laid
// out at, then uniformly scaled to match however big the table actually
// renders — so cards/text grow or shrink along with the table itself.
const FELT_BASE_WIDTH = 820;
const FELT_BASE_HEIGHT = 410;
const MIN_FELT_WIDTH = 280;
const MIN_FELT_HEIGHT = 150;

// Space between the corner boxes and the felt table, and the outer padding
// around the whole layout.
const GAP = 24;
const OUTER_PADDING = 20;

// Fixed "natural" width every corner box renders at before any shrink-to-fit
// scaling is applied.
const CORNER_WIDTH = 340;

/**
 * FeltTable — the oval table surface, rendered at an exact caller-supplied
 * pixel size (computed by PokerTable below to exactly fill the leftover
 * space between the 4 corner boxes). Its contents are laid out at a fixed
 * reference size and uniformly scaled to match.
 */
const FeltTable = ({ left, top, width, height, phase, communityCards, pot, currentBet }) => {
  const scale = Math.max(0.05, Math.min(width / FELT_BASE_WIDTH, height / FELT_BASE_HEIGHT));

  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        left,
        top,
        width,
        height,
        background: "radial-gradient(ellipse at 50% 40%, #164a36 0%, #0d2d20 60%, #0a2218 100%)",
        boxShadow:
          "inset 0 0 60px rgba(0,0,0,0.5), 0 0 0 10px #2c1a0e, 0 0 0 14px #1a0f07, 0 8px 32px rgba(0,0,0,0.6)",
        borderRadius: "50%",
      }}
    >
      {/* Table rail highlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: "50%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 40%)",
        }}
      />

      <div
        className="flex flex-col items-center justify-center relative flex-shrink-0"
        style={{
          width: FELT_BASE_WIDTH,
          height: FELT_BASE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {/* Phase badge */}
        <div
          className="absolute top-5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-sm font-mono font-semibold tracking-widest uppercase"
          style={{
            background: "rgba(212,168,67,0.15)",
            border: "1px solid rgba(212,168,67,0.3)",
            color: "#d4a843",
          }}
        >
          {PHASE_LABELS[phase] || phase}
        </div>

        {/* Community cards */}
        <div className="flex gap-3 items-center justify-center mt-1">
          {Array.from({ length: 5 }, (_, i) => {
            const card = communityCards[i];
            return (
              <PlayingCard
                key={i}
                rank={card?.rank}
                suit={card?.suit}
                faceDown={false}
                size="lg"
                delay={i * 80}
              />
            );
          })}
        </div>

        {/* Pot */}
        <div className="mt-4 flex flex-col items-center gap-1">
          <span className="text-sm text-white/40 font-body uppercase tracking-widest">Pot</span>
          <span className="text-4xl font-display font-bold" style={{ color: "#d4a843" }}>
            ${pot.toLocaleString()}
          </span>
          {currentBet > 0 && (
            <span className="text-sm text-white/50 font-mono">Bet: ${currentBet}</span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * PokerTable — 4 player seats pinned to the corners of whatever space this
 * component is given, with the felt table filling all the leftover space
 * between them (computed in JS, not CSS flexible tracks — see the long
 * comment below for why).
 *
 * Layout algorithm (recomputed on resize via ResizeObserver):
 *  1. Measure each corner box's natural (unscaled) width/height.
 *  2. If the 4 corners at natural size would leave less than
 *     MIN_FELT_WIDTH x MIN_FELT_HEIGHT for the table, shrink ALL corner
 *     boxes uniformly (via CSS transform, anchored at their own corner so
 *     they stay pinned to the edge) by just enough that everything fits —
 *     this is what guarantees zero clipping at any viewport size, while
 *     preferring full-size corners whenever there's room.
 *  3. The felt table gets an exact pixel width/height equal to whatever
 *     space is left after the (possibly shrunk) corners, gaps, and padding
 *     are accounted for — so there's never a big empty margin around it.
 *
 * Note on why this isn't done with CSS Grid `1fr` / flexbox `flex-grow`:
 * those need a definite container height to distribute from. This component
 * is meant to fill whatever bounded space its parent already gives it
 * (SpectatorView's content area, or DealerView's left column) — which IS
 * definite (both views constrain it via a min-h-0 flex chain) — so plain
 * measurement + arithmetic here is enough; no uniform-scale-a-fixed-canvas
 * wrapper (like the old ScaleToFit) is needed anymore.
 *
 * Props: gameState (session object)
 */
const PokerTable = ({ gameState }) => {
  const outerRef = useRef(null);
  const tlInnerRef = useRef(null);
  const trInnerRef = useRef(null);
  const blInnerRef = useRef(null);
  const brInnerRef = useRef(null);

  const [layout, setLayout] = useState({
    cornerScale: 1,
    feltLeft: 0,
    feltTop: 0,
    feltWidth: FELT_BASE_WIDTH,
    feltHeight: FELT_BASE_HEIGHT,
  });

  useLayoutEffect(() => {
    const outerEl = outerRef.current;
    if (!outerEl) return;

    const recompute = () => {
      const availW = outerEl.clientWidth;
      const availH = outerEl.clientHeight;
      if (!availW || !availH) return;

      const tlW = tlInnerRef.current?.offsetWidth || CORNER_WIDTH;
      const tlH = tlInnerRef.current?.offsetHeight || 0;
      const trW = trInnerRef.current?.offsetWidth || CORNER_WIDTH;
      const trH = trInnerRef.current?.offsetHeight || 0;
      const blW = blInnerRef.current?.offsetWidth || CORNER_WIDTH;
      const blH = blInnerRef.current?.offsetHeight || 0;
      const brW = brInnerRef.current?.offsetWidth || CORNER_WIDTH;
      const brH = brInnerRef.current?.offsetHeight || 0;

      const naturalLeftColW = Math.max(tlW, blW);
      const naturalRightColW = Math.max(trW, brW);
      const naturalTopRowH = Math.max(tlH, trH);
      const naturalBottomRowH = Math.max(blH, brH);

      const neededH = naturalTopRowH + naturalBottomRowH + GAP * 2 + OUTER_PADDING * 2 + MIN_FELT_HEIGHT;
      const neededW = naturalLeftColW + naturalRightColW + GAP * 2 + OUTER_PADDING * 2 + MIN_FELT_WIDTH;

      const cornerScale = Math.min(1, availH / neededH, availW / neededW);

      const topRowH = naturalTopRowH * cornerScale;
      const bottomRowH = naturalBottomRowH * cornerScale;
      const leftColW = naturalLeftColW * cornerScale;
      const rightColW = naturalRightColW * cornerScale;

      const feltWidth = Math.max(MIN_FELT_WIDTH, availW - leftColW - rightColW - GAP * 2 - OUTER_PADDING * 2);
      const feltHeight = Math.max(MIN_FELT_HEIGHT, availH - topRowH - bottomRowH - GAP * 2 - OUTER_PADDING * 2);
      const feltLeft = OUTER_PADDING + leftColW + GAP;
      const feltTop = OUTER_PADDING + topRowH + GAP;

      setLayout({ cornerScale, feltLeft, feltTop, feltWidth, feltHeight });
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(outerEl);
    [tlInnerRef, trInnerRef, blInnerRef, brInnerRef].forEach((r) => {
      if (r.current) observer.observe(r.current);
    });
    return () => observer.disconnect();
  }, [gameState]);

  if (!gameState) return null;

  const { players = [], communityCards = [], pot = 0, phase = "idle", currentBet = 0, activePlayerSeat = 1, buttonSeat = 1, smallBlindSeat = 2, bigBlindSeat = 3 } = gameState;

  const [p1, p2, p3, p4] = [
    players.find((p) => p.seat === 1),
    players.find((p) => p.seat === 2),
    players.find((p) => p.seat === 3),
    players.find((p) => p.seat === 4),
  ];

  const getRole = (seat) => {
    if (seat === buttonSeat) return "dealer";
    if (seat === smallBlindSeat) return "small-blind";
    if (seat === bigBlindSeat) return "big-blind";
    return null;
  };

  const { cornerScale, feltLeft, feltTop, feltWidth, feltHeight } = layout;

  return (
    <div className="w-full h-full" style={{ padding: OUTER_PADDING }}>
      <div ref={outerRef} className="relative w-full h-full overflow-hidden">
        {/* Player 1 — top-left, scales anchored to the top-left corner */}
        <div
          className="absolute top-0 left-0"
          style={{ transform: `scale(${cornerScale})`, transformOrigin: "top left" }}
        >
          <div ref={tlInnerRef} style={{ width: CORNER_WIDTH }}>
            <PlayerSeat player={p1} position="top-left" cardSize="xl" isActiveTurn={p1?.seat === activePlayerSeat} role={getRole(p1?.seat)} />
          </div>
        </div>

        {/* Player 2 — top-right */}
        <div
          className="absolute top-0 right-0"
          style={{ transform: `scale(${cornerScale})`, transformOrigin: "top right" }}
        >
          <div ref={trInnerRef} style={{ width: CORNER_WIDTH }}>
            <PlayerSeat player={p2} position="top-right" cardSize="xl" isActiveTurn={p2?.seat === activePlayerSeat} role={getRole(p2?.seat)} />
          </div>
        </div>

        {/* Player 4 — bottom-left */}
        <div
          className="absolute bottom-0 left-0"
          style={{ transform: `scale(${cornerScale})`, transformOrigin: "bottom left" }}
        >
          <div ref={blInnerRef} style={{ width: CORNER_WIDTH }}>
            <PlayerSeat player={p4} position="bottom-left" cardSize="xl" isActiveTurn={p4?.seat === activePlayerSeat} role={getRole(p4?.seat)} />
          </div>
        </div>

        {/* Player 3 — bottom-right */}
        <div
          className="absolute bottom-0 right-0"
          style={{ transform: `scale(${cornerScale})`, transformOrigin: "bottom right" }}
        >
          <div ref={brInnerRef} style={{ width: CORNER_WIDTH }}>
            <PlayerSeat player={p3} position="bottom-right" cardSize="xl" isActiveTurn={p3?.seat === activePlayerSeat} role={getRole(p3?.seat)} />
          </div>
        </div>

        <FeltTable
          left={feltLeft}
          top={feltTop}
          width={feltWidth}
          height={feltHeight}
          phase={phase}
          communityCards={communityCards}
          pot={pot}
          currentBet={currentBet}
        />
      </div>
    </div>
  );
};

export default PokerTable;
