import { Server, Socket } from "socket.io";
import { generateGameId } from "../utils/helpers.js";
import { Quiz, GameSession } from "../models/game.js";
import fs from "fs";
import path from "path";

interface Player {
  socketId: string;
  name: string;
  token: string;
  isReady: boolean;
}

interface GameRoom {
  players: Player[]; // max 2
  deletionTimeout?: NodeJS.Timeout;
  countdownInterval?: NodeJS.Timeout;
}

const __dirname = path.resolve();
const quizzes: Quiz[] = JSON.parse(fs.readFileSync(path.join(__dirname, "src/quizzes.json"), "utf-8"));

const games: Record<string, GameRoom> = {};
let curGame: GameSession | null = null;
let curQuiz: Quiz | undefined | null = null;
let curGameId: string | null = null;
/*
router.get("/:quizId/information", (req: Request, res: Response) => {
  if (!curGame || curGame.quizId !== req.params.quizId) return res.status(404).json({ error: "Game not found" });
  res.json(curGame);
}); */

export default function setupMultiplayerSockets(io: Server) {

  // Create Player func
  function createPlayer(socketId: string, name: string, token: string) : Player {
    return {
      socketId, 
      name, 
      token, 
      isReady: false
    }
  }

  interface EmitOtherType<T = any> {
    emitCommand: string;
    roomId: string;
    socketId: string;
    payload: T;
  }
  function emitOther<T>({ emitCommand, roomId, socketId, payload }: EmitOtherType<T>) {
    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    if (!roomSockets || roomSockets.size === 0) return;

    for (const id of roomSockets) {
      if (id !== socketId) {
        io.to(id).emit(emitCommand, payload);
      }
    }

    console.log(`➡️ Emitted '${emitCommand}' to ${roomSockets.size - 1} other socket(s) in room ${roomId}`);
  }

  io.on("connection", (socket: Socket) => {

    console.log("Client connected:", socket.id);

    socket.on("create_room", ({ playerName, playerToken, quizId }, callback) => {
      console.log("Creating Room");
      const gameId = generateGameId();
      curGameId = gameId
      games[gameId] = { players: [] };

      curQuiz = quizzes.find(q => q.quizId === quizId);
      console.log(quizId);
      console.log(curQuiz);
      let curGame = null;

      if (curQuiz) {
        curGame = {
          gameId,
          quizId: curQuiz.quizId,
          currentQuestionIndex: 0,
          questions: curQuiz.questions,
          answers: [],
          score: 0,
          isFinished: false,
          createdAt: new Date().toISOString(),
        };
      }

      console.log("Created room:", gameId);
      console.log(games[gameId]);

      // ✅ Send event to client (so it behaves like before)
      socket.emit("room_created", { gameId, hasQuiz: !!curQuiz });

      // ✅ Also respond via acknowledgment (optional)
      if (callback) {
        callback({
          success: true,
          gameId,
          hasQuiz: !!curQuiz,
        });
      }
    });


    socket.on("information", (callback) => {
      console.log("Sending quiz info to:", socket.id);
      console.log(curQuiz)
      callback({ curQuiz, curGame, curGameId });
    });


    socket.on("join_room", ({ roomId, playerName, playerToken  }) => {
      if (roomId && games[roomId]) {

        console.log("player " + playerName +  " joining room " + roomId)
        const game = games[roomId];

        // Cancel any pending deletion
        if (game.deletionTimeout) {
          clearTimeout(game.deletionTimeout);
          game.deletionTimeout = undefined;
        }

        if (game.players.length >= 2) {
          console.log("room full");
          socket.emit("room_full");
          return;
        }
        
        game.players.push(createPlayer(socket.id, playerName, playerToken));
        socket.join(roomId);

        io.to(roomId).emit("player_joined", { opponentName: playerName });

        const otherPlayers = game.players
        .filter(p => p.socketId !== socket.id)
        .map(p => ({ name: p.name }));

        socket.emit("room_joined", { players: otherPlayers });
        console.log("Player joined room");
        console.log(game)
      } else {
        const gameId = generateGameId();
        games[gameId] = { players: [createPlayer(socket.id, playerName, playerToken)] };
        socket.join(gameId);
        socket.emit("room_created", { gameId });
      }
    });

  interface ReadystatePayload {
    roomId: string;
    playerSocket: string;
    state: boolean;
  }

  // ready up player
  socket.on("readyState", ({ roomId, playerSocket, state }: ReadystatePayload)=> {

      const game: GameRoom = games[roomId];
      const checkPlayer = game.players.find(p => p.socketId === playerSocket) /* Player | undefined */
      if(!checkPlayer) return;
      const player: Player = checkPlayer;
      console.log("setting player ready as: " + state + " for socket: " + playerSocket + " in game: " + roomId)
      player.isReady = state;

      socket.emit("readyClient", { state })

      // Notify opponent this player is now ready
      type ReadyOpponentPayload = { state: boolean; opponent: string };
      emitOther<ReadyOpponentPayload>({emitCommand: "readyOpponent", roomId, socketId: socket.id, payload:{state: state, opponent: player.name} })

      // if both players are ready, start countdown
      if (game.players.length === 2 && game.players.every(p => p.isReady)) {
        console.log(`Both players ready in room ${roomId}, starting countdown...`);

        // If there’s already a countdown running, skip creating another
        if (game.countdownInterval) {
          console.log("Countdown already active, skipping new one.");
          return;
        }

        let countdown = 5;
        const interval = setInterval(() => {
          io.to(roomId).emit("countdown_tick", { countdown });
          console.log(`Countdown tick ${countdown} for room ${roomId}`);

          countdown--;

          if (countdown < 0) {
            clearInterval(interval);
            game.countdownInterval = undefined; // cleanup reference
            io.to(roomId).emit("game_start");
            console.log(`Game started for room ${roomId}`);
          }
        }, 1000);

        game.countdownInterval = interval; // ✅ store reference
      } else {
        // ❌ One player unreadied — cancel countdown if it’s running
        if (game.countdownInterval) {
          clearInterval(game.countdownInterval);
          game.countdownInterval = undefined;
          io.to(roomId).emit("countdown_cancelled");
          console.log(`Countdown cancelled for room ${roomId}`);
        }
      }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    // Find which room this socket belonged to
    for (const [roomId, game] of Object.entries(games)) {
      const playerIndex = game.players.findIndex((p: Player) => p.socketId === socket.id);

      if (playerIndex !== -1) {
        const [removedPlayer] = game.players.splice(playerIndex, 1);
        console.log(`Removed player ${removedPlayer.name} from room ${roomId}`);

        // Notify remaining player, if any
        if (game.players.length > 0) {
          const remainingPlayer = game.players[0];
          io.to(remainingPlayer.socketId).emit("opponent_left", { opponent: removedPlayer.name });
        }

        // If room now empty, schedule a delayed deletion
        if (game.players.length === 0) {
          console.log(`Room ${roomId} is empty — scheduling deletion in 5s...`);

          // Attach deletion timeout property dynamically
          const room = game;

          room.deletionTimeout = setTimeout(() => {
            // Double-check no one rejoined before deleting
            if (games[roomId] && games[roomId].players.length === 0) {
              delete games[roomId];
              console.log(`🗑️ Deleted empty room ${roomId}`);
            }
          }, 5000);
        }

        break; // stop after handling the correct room
      }
    }
  });


  });
}
