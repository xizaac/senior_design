const Session = require("../models/Session");

const initGameSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // ── Join a session room ───────────────────────────────────────────────────
    socket.on("session:join", async ({ sessionCode }) => {
      if (!sessionCode) return;

      const code = sessionCode.toUpperCase();
      socket.join(code);
      console.log(`👁️  ${socket.id} joined room: ${code}`);

      // Send current state immediately to the joining client
      try {
        const session = await Session.findOne({
          sessionCode: code,
          status: { $in: ["waiting", "active"] },
        });
        if (session) {
          socket.emit("game:stateUpdate", session);

          // Increment spectator count
          session.spectatorCount = (session.spectatorCount || 0) + 1;
          await session.save();
          io.to(code).emit("spectator:count", { count: session.spectatorCount });
        }
      } catch (err) {
        console.error("session:join error:", err);
      }
    });

    // ── Leave a session room ──────────────────────────────────────────────────
    socket.on("session:leave", async ({ sessionCode }) => {
      if (!sessionCode) return;
      const code = sessionCode.toUpperCase();
      socket.leave(code);

      try {
        const session = await Session.findOne({ sessionCode: code });
        if (session && session.spectatorCount > 0) {
          session.spectatorCount -= 1;
          await session.save();
          io.to(code).emit("spectator:count", { count: session.spectatorCount });
        }
      } catch (err) {
        console.error("session:leave error:", err);
      }
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = { initGameSocket };
