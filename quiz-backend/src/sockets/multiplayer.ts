import { Server, Socket } from "socket.io";
import { generateGameId } from "../utils/helpers.js";
import { Quiz, GameSession } from "../models/game.js";
import fs from "fs";
import path from "path";

interface Player {
  socketId: string;
  name: string;
  token: string;
}

interface GameRoom {
  players: Player[]; // max 2
}

const __dirname = path.resolve();
const quizzes: Quiz[] = JSON.parse(fs.readFileSync(path.join(__dirname, "src/quizzes.json"), "utf-8"));

const games: Record<string, GameRoom> = {};
let curGame: GameSession | null = null;
let curQuiz: Quiz | undefined | null = null;

/*
router.get("/:quizId/information", (req: Request, res: Response) => {
  if (!curGame || curGame.quizId !== req.params.quizId) return res.status(404).json({ error: "Game not found" });
  res.json(curGame);
}); */
export default function setupMultiplayerSockets(io: Server) {
  io.on("connection", (socket: Socket) => {

    console.log("Client connected:", socket.id);

    socket.on("create_room", ({ playerName, playerToken, quizId }, callback) => {
      console.log("Creating Room");
      const gameId = generateGameId();
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
      callback({ curQuiz, curGame });
    });


    socket.on("join_room", ({ roomId, playerName, playerToken  }) => {
      if (roomId && games[roomId]) {

        console.log("player " + playerName +  " joining room " + roomId)
        const game = games[roomId];

        if (game.players.length >= 2) {
          console.log("room full");
          socket.emit("room_full");
          return;
        }

        game.players.push({ socketId: socket.id, name: playerName, token: playerToken });
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
        games[gameId] = { players: [{ socketId: socket.id, name: playerName, token: playerToken }] };
        socket.join(gameId);
        socket.emit("room_created", { gameId });
      }
    });


  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    // Iterate through all rooms
    for (const [roomId, game] of Object.entries(games)) {
      const playerIndex = game.players.findIndex(p => p.socketId === socket.id);

      if (playerIndex !== -1) {
        const [removedPlayer] = game.players.splice(playerIndex, 1); // remove player
        console.log(`Removed player ${removedPlayer.name} from room ${roomId}`);
        // Optionally notify the remaining player
        if (game.players.length > 0) {
          const remainingPlayer = game.players[0];
          const opponent = removedPlayer.name;
          io.to(remainingPlayer.socketId).emit("opponent_left", { opponent });
        }

        // If room is empty, delete it
        if (game.players.length === 0) {
          delete games[roomId];
          console.log(`Deleted empty room ${roomId}`);
        }

        break; // stop iterating once we found the room
      }
    }
  });

  });
}
