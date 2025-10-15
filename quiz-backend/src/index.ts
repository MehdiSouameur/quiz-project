import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import quizRoutes from "./routes/quiz.js";
import authRoutes from "./routes/auth.js";
import setupMultiplayerSockets from "./sockets/multiplayer.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(cors({
  origin: "http://localhost:3000", // must match your frontend exactly
  credentials: true,               // allow cookies
}));
app.use(cookieParser());

app.use(express.json());

// REST API routes
app.use("/api/quiz", quizRoutes);
app.use("/api/auth", authRoutes)

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,               
  },
});


// WebSocket logic
setupMultiplayerSockets(io);

// Start server
server.listen(3001, () => console.log("Quiz backend with WebSocket running on port 3001"));
