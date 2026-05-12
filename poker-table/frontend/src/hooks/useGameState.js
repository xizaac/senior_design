import { useState, useEffect } from "react";
import useSocket from "./useSocket";

/**
 * Subscribes to live game state updates for a given session code.
 * Returns { gameState, spectatorCount, connectionStatus }
 */
const useGameState = (sessionCode, initialState = null) => {
  const [gameState, setGameState] = useState(initialState);
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const { socket, joinSession, leaveSession } = useSocket();

  useEffect(() => {
    if (!sessionCode) return;

    const sock = socket.current;
    if (!sock) return;

    // Join the session room and get initial state
    joinSession(sessionCode);

    const onStateUpdate = (session) => {
      setGameState(session);
      setConnectionStatus("connected");
    };

    const onSpectatorCount = ({ count }) => {
      setSpectatorCount(count);
    };

    const onConnect = () => setConnectionStatus("connected");
    const onDisconnect = () => setConnectionStatus("disconnected");
    const onReconnect = () => {
      setConnectionStatus("reconnecting");
      joinSession(sessionCode); // rejoin room after reconnect
    };

    sock.on("game:stateUpdate", onStateUpdate);
    sock.on("spectator:count", onSpectatorCount);
    sock.on("connect", onConnect);
    sock.on("disconnect", onDisconnect);
    sock.on("reconnect", onReconnect);

    return () => {
      leaveSession(sessionCode);
      sock.off("game:stateUpdate", onStateUpdate);
      sock.off("spectator:count", onSpectatorCount);
      sock.off("connect", onConnect);
      sock.off("disconnect", onDisconnect);
      sock.off("reconnect", onReconnect);
    };
  }, [sessionCode]);

  return { gameState, setGameState, spectatorCount, connectionStatus };
};

export default useGameState;
