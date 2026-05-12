import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PokerTable from "../components/PokerTable";
import BetControls from "../components/BetControls";
import SessionCodeDisplay from "../components/SessionCodeDisplay";
import useGameState from "../hooks/useGameState";
import { advancePhase, endSession, resetPlayer, joinSession as apiJoin } from "../api";

const PHASES = ["pre-flop", "flop", "turn", "river", "showdown"];

const PHASE_NEXT = {
  idle: "pre-flop",
  "pre-flop": "flop",
  flop: "turn",
  turn: "river",
  river: "showdown",
  showdown: null,
};

const DealerView = () => {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  const [initialSession, setInitialSession] = useState(null);
  const [phaseLoading, setPhaseLoading] = useState(false);
  const [endLoading, setEndLoading] = useState(false);
  const [error, setError] = useState("");

  // Load initial state from API
  useEffect(() => {
    apiJoin(sessionCode)
      .then((res) => setInitialSession(res.data.session))
      .catch(() => navigate("/"));
  }, [sessionCode]);

  const { gameState, setGameState, spectatorCount, connectionStatus } =
    useGameState(sessionCode, initialSession);

  const session = gameState || initialSession;

  const handleNextPhase = async () => {
    if (!session) return;
    const next = PHASE_NEXT[session.phase];
    if (!next) return;
    setPhaseLoading(true);
    setError("");
    try {
      const res = await advancePhase(sessionCode, next);
      setGameState(res.data.session);
    } catch (err) {
      setError("Failed to advance phase");
    } finally {
      setPhaseLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!confirm("Are you sure you want to end this game session?")) return;
    setEndLoading(true);
    try {
      await endSession(sessionCode);
      navigate("/");
    } catch (err) {
      setError("Failed to end session");
      setEndLoading(false);
    }
  };

  const handleResetPlayer = async (seat) => {
    try {
      const res = await resetPlayer(sessionCode, seat);
      setGameState(res.data.session);
    } catch (err) {
      setError("Failed to reset player");
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-white/50 animate-pulse font-mono">Loading session...</span>
      </div>
    );
  }

  const nextPhase = PHASE_NEXT[session.phase];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}
      >
        <div className="flex items-center gap-3">
          <span className="font-display text-lg" style={{ color: "#d4a843" }}>
            ♠ Dealer Control
          </span>
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded-full ${
              connectionStatus === "connected"
                ? "bg-green-500/20 text-green-400"
                : "bg-yellow-500/20 text-yellow-400"
            }`}
          >
            {connectionStatus === "connected" ? "● Live" : "○ " + connectionStatus}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {session.lastEsp32Update && (
            <span className="text-xs text-white/30 font-mono hidden sm:block">
              ESP32: {new Date(session.lastEsp32Update).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleEndSession}
            disabled={endLoading}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171",
            }}
          >
            {endLoading ? "Ending..." : "End Session"}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-auto">
        {/* ── Left: Table View ─────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-4">
          <SessionCodeDisplay code={sessionCode} spectatorCount={spectatorCount} />
          <PokerTable gameState={session} />

          {/* Phase controls */}
          <div
            className="rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex-1">
              <div className="text-xs text-white/40 uppercase tracking-widest mb-1">
                Game Phase
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {PHASES.map((p) => (
                  <span
                    key={p}
                    className="text-xs px-2 py-0.5 rounded font-mono"
                    style={{
                      background:
                        session.phase === p
                          ? "rgba(212,168,67,0.25)"
                          : "rgba(255,255,255,0.05)",
                      color: session.phase === p ? "#d4a843" : "rgba(255,255,255,0.3)",
                      border: `1px solid ${
                        session.phase === p
                          ? "rgba(212,168,67,0.4)"
                          : "rgba(255,255,255,0.06)"
                      }`,
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
            {nextPhase && (
              <button
                onClick={handleNextPhase}
                disabled={phaseLoading}
                className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #d4a843, #e8c46a)",
                  color: "#1a0f07",
                }}
              >
                {phaseLoading ? "..." : `→ ${nextPhase.charAt(0).toUpperCase() + nextPhase.slice(1)}`}
              </button>
            )}
          </div>
        </div>

        {/* ── Right: Bet Controls per player ──────────────────────── */}
        <div
          className="lg:w-72 rounded-2xl p-4 space-y-3 overflow-y-auto"
          style={{
            background: "rgba(0,0,0,0.2)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-base text-white/80">Bet Controls</h2>
            <span className="text-xs text-white/30">Pot: ${session.pot}</span>
          </div>

          {session.players.map((player) => (
            <div key={player.seat} className="space-y-1">
              <BetControls
                player={player}
                sessionCode={sessionCode}
                onUpdate={setGameState}
              />
              {(player.action === "fold" || !player.isActive) && (
                <button
                  onClick={() => handleResetPlayer(player.seat)}
                  className="w-full text-xs py-1 rounded text-white/30 hover:text-white/60 transition-colors"
                >
                  ↺ Reset player
                </button>
              )}
            </div>
          ))}

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default DealerView;
