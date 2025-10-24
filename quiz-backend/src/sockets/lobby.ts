import { Server, Socket } from "socket.io";
import { generateGameId } from "../utils/helpers.js";
import { Quiz, GameSession, Question } from "../models/game.js";
import { CreateGame } from "./play.js";
import fs from "fs";
import path from "path";

interface Player {
  socketId: string;
  name: string;
  token: string;
  isReady: boolean;
}

interface GameRoom {
  roomId: string;
  quizId: string;
  players: Player[];
  currentQuestionIndex: number;
  questions: Question[];
  quiz?: Quiz;
  answers: { questionId: number; selected: string; correct: boolean }[];
  score: number;
  deletionTimeout?: NodeJS.Timeout;
  countdownInterval?: NodeJS.Timeout;
  isStarted: boolean;
}

const __dirname = path.resolve();
const quizzes: Quiz[] = JSON.parse(fs.readFileSync(path.join(__dirname, "src/quizzes.json"), "utf-8"));

const games: Record<string, GameRoom> = {};

export default function setupLobbyServer(io: Server) {

    function createGameRoom(roomId: string) : GameRoom{
        return{
            roomId,
            quizId: "",
            players: [],
            currentQuestionIndex: 0,
            questions: [],
            answers: [],
            score: 0,
            isStarted: false
        }
    }

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
        const lobbyAdapter = io.of("/lobby").adapter;
        const roomSockets = lobbyAdapter.rooms.get(roomId);

        if (!roomSockets || roomSockets.size === 0) return;

        for (const id of roomSockets) {
        if (id !== socketId) {
            io.of("/lobby").to(id).emit(emitCommand, payload);
        }
        }

        console.log(`➡️ Emitted '${emitCommand}' to ${roomSockets.size - 1} other socket(s) in room ${roomId}`);
    }

    io.of("/lobby").on("connection", (socket: Socket) => {

        console.log("Client connected:", socket.id);

        socket.on("create_room", ({ quizId }) => {

            console.log("Creating Room");
            console.log("Retrieving quiz: " + quizId);
            const _roomId = generateGameId();
            const _curGame: GameRoom = createGameRoom(_roomId);
            const _quiz = quizzes.find(q => q.quizId === quizId); // type Quiz
    
            if(_quiz){
                _curGame.quiz = _quiz;
            }
    
            console.log(_curGame.quiz);
            console.log(_curGame);
            console.log(games);
            games[_roomId] = _curGame;
    
            socket.emit("room_created", { _roomId});
    
        });

        // Handle request for info
        socket.on("get_information", ({ _roomId }) => {
            const _curGame = games[_roomId];

            if (!_curGame) {
                console.log("Game " + _roomId + " doesn't exist");
                socket.emit("information_response", { quizData: null });
            } else {
                console.log("Sendding over quiz: " + _curGame.quiz?.quizId);
                socket.emit("information_response", { quizData: _curGame.quiz });
            }
        });

        socket.on("join_room", ({ roomId, playerName, playerToken  }) => {

            if (roomId && games[roomId]) {

                console.log("player " + playerName +  " joining room " + roomId)
                const game = games[roomId]; // type GameRoom

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

                console.log("Emitting player joined: " + playerName)

                io.of("/lobby").to(roomId).emit("player_joined", { opponentName: playerName });

                const otherPlayers = game.players
                    .filter(p => p.socketId !== socket.id)
                    .map(p => ({ name: p.name }));

                socket.emit("room_joined", { players: otherPlayers });

                //type RoomJoinedPayload = {opponentName: string}
                //emitOther<RoomJoinedPayload>({emitCommand: "room_joined", roomId, socketId: socket.id, payload: {opponentName: playerName } });
                console.log("Player joined room");
                console.log(game)
            } else {
                // Write code to create room
                console.log("Can't join non-existant room: " + roomId)
            }
        });

        interface ReadystatePayload {
            roomId: string;
            playerSocket: string;
            state: boolean;
        }

        socket.on("readyState", ({ roomId, playerSocket, state }: ReadystatePayload)=> {

            console.log("setting player ready as: " + state + " for socket: " + playerSocket + " in game: " + roomId)
            const game: GameRoom = games[roomId];
            const checkPlayer = game.players.find(p => p.socketId === playerSocket) /* Player | undefined */
            if(!checkPlayer) return;
            const player: Player = checkPlayer;
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

            let countdown = 1;
            const interval = setInterval(() => {
                io.of("/lobby").to(roomId).emit("countdown_tick", { countdown });
                console.log(`Countdown tick ${countdown} for room ${roomId}`);

                countdown--;

                if (countdown < 0) {
                    clearInterval(interval);
                    game.countdownInterval = undefined; // cleanup reference
                    console.log("before we create game: ")
                    console.log("")
                    console.log(game)
                    if(game.quiz?.quizId) CreateGame(io, roomId, game.quiz?.quizId)
                    io.of("/lobby").to(roomId).emit("game_start", {roomId});
                    game.isStarted = true;
                    console.log(`Game started for room ${roomId}`);
                }
            }, 1000);

            game.countdownInterval = interval; // ✅ store reference
            } else {
            // ❌ One player unreadied — cancel countdown if it’s running
            if (game.countdownInterval) {
                clearInterval(game.countdownInterval);
                game.countdownInterval = undefined;
                io.of("/lobby").to(roomId).emit("countdown_cancelled");
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

                    clearInterval(game.countdownInterval);
                    game.countdownInterval = undefined;
                    io.of("/lobby").to(roomId).emit("countdown_cancelled");

                    // Notify remaining player, if any
                    if (game.players.length > 0) {
                        const remainingPlayer = game.players[0];
                        io.of("/lobby").to(remainingPlayer.socketId).emit("opponent_left", { opponent: removedPlayer.name });
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