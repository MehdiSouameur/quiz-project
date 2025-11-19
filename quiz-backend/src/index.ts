import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import quizRoutes from "./routes/quiz.js";
import authRoutes from "./routes/auth.js";
import setupMultiplayerSockets from "./sockets/multiplayer.js";
import cookieParser from "cookie-parser";
import setupMultiplayerSockets_V2 from "./sockets/lobby.js";
import setupGameServer from "./sockets/play.js";
import setupLobbyServer from "./sockets/lobby.js";

const app = express();

const allowedOrigins = [
  "https://quiz-project-ruby.vercel.app",
  "http://localhost:3000",
];

// CORS for REST API
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(cookieParser());

app.use(express.json());

// REST API routes
app.use("/api/quiz", quizRoutes);
app.use("/api/auth", authRoutes)

const PORT = process.env.PORT || 3001;

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,               
  },
});


// WebSocket logic
setupLobbyServer(io);
setupGameServer(io);

// Start server
server.listen(PORT, () => console.log("Quiz backend with WebSocket running on port 3001"));
