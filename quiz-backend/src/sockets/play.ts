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
    isReady: boolean;
}

interface GameSession {
  gameId: string;
  quizId: string;
  playerId?: string;
  players: Player[]
  currentQuestionIndex: number;
  questions: Question[];
  round: {
    answeredPlayers: Set<string>;
    timeoutId?: NodeJS.Timeout;
    };

}

function createPlayer(socketId: string, name: string, token: string) : Player{
    return{
        socketId,
        name,
        token,
        score: 0,
        answers: [],
        isReady: false
    }
}

function createGameRoom(gameId: string, quizId: string) : GameSession{
    return{
        gameId,
        quizId: "",
        players: [],
        currentQuestionIndex: 0,
        questions: [],
        round: {
            answeredPlayers: new Set(),
        }
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
        startRound();
    }

    function startRound() {

        if(!CurGame) {
            console.log("No game to speak of.");
            return;
        }

        console.log("Starting round");
        console.log("Sending question: " + CurGame.currentQuestionIndex + " of current game");
        const question = CurGame?.questions[CurGame.currentQuestionIndex]; //type Question
        if(!question){
            console.log("Error: question not found, maybe index probleem?")
        }

        CurGame.round.answeredPlayers = new Set();

        const ROUND_TIME = 10000;

        CurGame.round.timeoutId = setTimeout(() => {
            console.log("⏰ Round timed out");

            nextRound();
        }, ROUND_TIME);

        play.emit("start_round" , { question });
        console.log("Question sent");

    }

    function nextRound(){
        if(!CurGame) {
            console.log("No game to speak of.");
            return;
        }
        
        const game = CurGame
        game.currentQuestionIndex+=1;

        if(game.questions.length <= game.currentQuestionIndex){

            setTimeout(() => {
                const player1 = game.players[0]
                const player2 = game.players[1]

                play.to(player1?.socketId).emit("game_finished", {player: player1.name, player_score: player1.score, opponent: player2.name, opponent_score: player2.score});
                play.to(player2?.socketId).emit("game_finished", {player: player2.name, player_score: player2.score, opponent: player1.name, opponent_score: player1.score});                
            }, 1500);

            console.log("game finished");
            return;
        }
        // Start next round after small delay
        setTimeout(() => {
            startRound();
        }, 1500);
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

            if(CurGame.players.length >= 2){
                console.log("All players joined, starting game");
                startGame();
            }

        });

        type PlayerReadyType = {token: String}
        socket.on("player_ready", ({ token } : PlayerReadyType) => {
            if (!CurGame) {
            console.log("No game found for player_ready");
            return;
            }

            // Type Player
            const player = CurGame.players.find(p => p.token === token);

            if (!player) {
                console.log(`No player found with token ${token} in game ${CurGame.gameId}`);
                return;
            }

            player.isReady = true
            console.log(`✅ Player ${player.name} (${player.token}) is now ready.`);

            // Optional: check if everyone is ready
            const allReady = CurGame.players.every(p => p.isReady);
            if (allReady) {
                console.log(`All players in game ${CurGame.gameId} are ready! Starting timer...`);
                play.emit("start_timer", { time: 10000 });


                CurGame.players.forEach(p => (p.isReady = false));
            }
        });


        type SubmitAnswerType = {selectedAnswer: string, token: string}
        socket.on("submit_answer", ({selectedAnswer, token}: SubmitAnswerType) => {
            console.log("Question is submitting")
            if(!CurGame){
                console.log("Game doesnt exist")
                return;
            }
            const player = CurGame.players.find(p => p.token === token);
            if (!player) {
                console.log(`⚠ Invalid token used in submit_answer: ${token}`);
                socket.emit("invalid_token"); // optional feedback
                return;
            }

            const opponent = CurGame.players.find(p => p.token !== token);

            if (!opponent) {
                console.log(`No opponent found in this game`);
                return;
            }

            CurGame.round.answeredPlayers.add(player.token);

            const curQuestion: Question = CurGame?.questions[CurGame.currentQuestionIndex];
            let isAllAnswered = false;
            // CORRECT
            if(selectedAnswer === curQuestion.answer){
                socket.emit("correct_answer")
                play.to(opponent.socketId).emit("opponent_answer");
                isAllAnswered = true;
                player.score+=100
            } 
            // INCORRECT
            else {
                socket.emit("incorrect_answer")
            }

            if(CurGame.round.answeredPlayers.size === CurGame.players.length || isAllAnswered){
                if (CurGame.round.timeoutId) {
                    clearTimeout(CurGame.round.timeoutId);
                    CurGame.round.timeoutId = undefined;
                }

                nextRound();
            }

        });

        socket.on("time_out", () => {
            console.log("a player timed out");
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
