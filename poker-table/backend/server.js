require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./services/db");
const gameRoutes = require("./routes/game");
const esp32Routes = require("./routes/esp32");
const { initGameSocket } = require("./sockets/gameSocket");

const app = express();
const httpServer = http.createServer(app);

// ── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Make io accessible from routes
app.set("io", io);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/game", gameRoutes);
app.use("/api/esp32", esp32Routes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── WebSocket ─────────────────────────────────────────────────────────────────
initGameSocket(io);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🃏 Poker Table Server running on port ${PORT}`);
  });
});
