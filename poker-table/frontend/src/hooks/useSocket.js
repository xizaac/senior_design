import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

let socketInstance = null;

/**
 * Custom hook that manages a Socket.io connection.
 * Returns { socket, joinSession, leaveSession }
 */
const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Reuse singleton socket across component remounts
    if (!socketInstance) {
      socketInstance = io(API_URL, {
        transports: ["websocket"],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });
    }
    socketRef.current = socketInstance;

    return () => {
      // Don't disconnect on unmount — keep alive for navigation
    };
  }, []);

  const joinSession = useCallback((sessionCode) => {
    if (socketRef.current) {
      socketRef.current.emit("session:join", { sessionCode });
    }
  }, []);

  const leaveSession = useCallback((sessionCode) => {
    if (socketRef.current) {
      socketRef.current.emit("session:leave", { sessionCode });
    }
  }, []);

  return { socket: socketRef, joinSession, leaveSession };
};

export default useSocket;
