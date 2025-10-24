import { Server, Socket } from "socket.io";
import { Quiz, Question } from "../models/game";
import fs from "fs";
import path from "path";

interface Player {
    socketId: string;
    name: string;
    token: string;
    score: number;
    answers: { questionId: number; selected: string; correct: boolean }[];
}

interface GameSession {
  gameId: string;
  quizId: string;
  playerId?: string;
  players: Player[]
  currentQuestionIndex: number;
  questions: Question[];
}

function createPlayer(socketId: string, name: string, token: string) : Player{
    return{
        socketId,
        name,
        token,
        score: 0,
        answers: []
    }
}

function createGameRoom(gameId: string, quizId: string) : GameSession{
    return{
        gameId,
        quizId: "",
        players: [],
        currentQuestionIndex: 0,
        questions: [],
    }
}

const __dirname = path.resolve();
const quizzes: Quiz[] = JSON.parse(fs.readFileSync(path.join(__dirname, "src/quizzes.json"), "utf-8"));
let CurGame: GameSession | null = null;

export default function setupGameServer(io: Server) {
    const play = io.of("/play");

    function startGame() {
        console.log("Starting game")
        if (!CurGame) {
            console.log("Error: no game to start, create a game first")
            return;
        }
        startRound(CurGame.currentQuestionIndex);
    }

    function startRound(index: number) {
        console.log("Starting round");
        console.log("Sending question: " + index + " of current game");
        const question = CurGame?.questions[index]; //type Question
        if(!question){
            console.log("Error: question not found, maybe index probleem?")
        }
        play.emit("current_question" , { question });
        console.log("Question sent");


    }

    play.on("connection", (socket: Socket) => {
        console.log("Client connected to game:", socket.id);

        type CreateGameType = {_gameId: string, _quizId: string }
        socket.on("create_game", ( { _gameId, _quizId } : CreateGameType ) => {
            const _quiz = quizzes.find(q => q.quizId === _quizId); // type Quiz
            if(!_quiz){
                console.log("Error: quiz:" + _quizId + "not found")
                return;
            }

            CurGame = createGameRoom(_gameId, _quizId);
        });

        type JoinGameType = {_gameId: string, _playerName: string, _playerToken: string}
        socket.on("join_game", ({_gameId, _playerName, _playerToken} : JoinGameType) => {

            console.log("player: " + _playerName + " with token: " +_playerToken + " joining game: " + _gameId)

            if(( CurGame?.gameId != _gameId)){
                console.log("Error: Incorrect gameId. curgame.gameid is: " + CurGame?.gameId)
                return;
            }
            if(!CurGame){
                console.log("Error: Game not created");
                return
            }

            const newPlayer = createPlayer(socket.id, _playerName, _playerToken)

            CurGame.players.push(newPlayer);

            console.log("Player has successfully joined")

            play.emit("game_joined")

        });

        socket.on("disconnect", () => {

            console.log("A player disconnected, destroying the game");
            if(CurGame && CurGame.players.length >= 2){
                CurGame = null;
                play.emit("game_cancelled");
            }
        });
    });
};

// play.ts
export function CreateGame(io: Server, gameId: string, quizId: string) {
  const play = io.of("/play");

  // do setup logic here
  console.log(`🎮 Creating new /play game: ${gameId}`);
    console.log(quizId)
  // Optionally preload the quiz
  const _quiz = quizzes.find(q => q.quizId === quizId);
  if (!_quiz) {
    console.log("Error: quiz not found for /play creation");
    return;
  }

  // Maybe store the game in memory or DB
  CurGame = createGameRoom(gameId, quizId);
  CurGame.questions = _quiz.questions;
  console.log("New game " + gameId + "created")
  console.log(CurGame)
}
