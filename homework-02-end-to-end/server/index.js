// server/index.js
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

// Yjs WebSocket utilities
import { setupWSConnection } from "./yjs-server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// WebSocket server for Yjs
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Store rooms (in-memory, add Redis/DB for persistence)
const rooms = new Map();

// API: Create new room
app.post("/api/rooms", (req, res) => {
  const roomId = uuidv4();
  const room = {
    id: roomId,
    createdAt: new Date().toISOString(),
    language: req.body.language || "javascript",
  };
  rooms.set(roomId, room);
  res.json({ roomId, url: `/room/${roomId}` });
});

// API: Get room info
app.get("/api/rooms/:id", (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) {
    // Create room on-the-fly if it doesn't exist
    const newRoom = {
      id: req.params.id,
      createdAt: new Date().toISOString(),
      language: "javascript",
    };
    rooms.set(req.params.id, newRoom);
    return res.json(newRoom);
  }
  res.json(room);
});

// API: List all rooms
app.get("/api/rooms", (req, res) => {
  res.json(Array.from(rooms.values()));
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// WebSocket connection for Yjs
wss.on("connection", (ws, req) => {
  console.log("WebSocket connection established");
  setupWSConnection(ws, req);
});

// Serve static files in production
const clientDist = path.join(__dirname, "..", "client", "dist");
import fs from "fs";

// Only serve static files if dist folder exists (production build)
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  // SPA fallback - serve index.html for all routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
} else {
  // Development mode - just return a helpful message
  app.get("/", (req, res) => {
    res.json({ 
      message: "API server running. Use http://localhost:5173 for the frontend in development.",
      api: "/api/rooms"
    });
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready for Yjs connections`);
});
