"use client";

import { useState, useEffect, useRef, use } from "react";
import { io, Socket} from "socket.io-client";
import QuizButton from "@/app/components/QuizButton";
import SubmitButton from "@/app/components/SubmitButton";
import Quiz from "../../offline/page";
import { time } from "console";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: number;
  title: string;
  options: Option[];
  answer: string;
}

function getCookie(name: string): string | null {
    return (
        document.cookie
        .split("; ")
        .find((row) => row.startsWith(name + "="))
        ?.split("=")[1] || null
    );
}

export default function Play() {
  /* Socket handling */ 
  const socketRef = useRef<Socket | null>(null);
  const initialized = useRef(false);
  const [timer, setTimer] = useState<number>(100);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
      if (initialized.current) return; // skip if already run
      initialized.current = true;
      const init = async () => {
          const token = getCookie("token");
          const name = getCookie("username");
          const params = new URLSearchParams(window.location.search);
          let gameParam = params.get("game");

          // ERROR CHECKING
          if(!token){
            console.log("Error: token is null");
            return;
          } else if(!name) {
            console.log("Error: name is null")
          } else if(!gameParam){
            console.log("Error: no game id in parameters")
          }

          const socket = io("http://localhost:3001/play", {
              auth: { token: token },
          });
          socketRef.current = socket

          console.log("Joining Game: " + gameParam)
          socket.emit("join_game", {_gameId: gameParam, _playerName: name, _playerToken: token})

          socket.on("game_joined", () => {
            console.log("Server response: Game joined!")
          })

          type StartRoundType = {question: Question}
          socket.on("start_round", ({question} : StartRoundType) => {
            console.log("Question received: ")
            console.log(question)

            resetRound();
            
            setTitle(question.title);
            setOptionA(question.options[0].text);
            setOptionB(question.options[1].text);
            setOptionC(question.options[2].text);
            setOptionD(question.options[3].text);     
            socket.emit("player_ready", {token: token});                               
          });
          
          type TimeType = {time: number}
          socket.on("start_timer", ({time}: TimeType) => {
            console.log("Starting timer...")

            setTimer(100);

            const totalTime = time; // e.g., 10_000
            const intervalTime = 100; // update every 0.1s
            const decrement = (100 / totalTime) * intervalTime;

            // TIMEOUT FUNCTION
            const interval = setInterval(() => {
              setTimer(prev => {
                if (prev <= 0) {
                  clearInterval(interval);
                  console.log("ime’s up!");
                  socket.emit("time_up");
                  setResult("timeout");
                  return 0;
                }
                return prev - decrement;
              });
            }, intervalTime);
            timerIntervalRef.current = interval;
          });

          socket.on("correct_answer", () => {
            console.log("Server: correct answer!");
            setResult("correct");
          });

          socket.on("incorrect_answer", () => {
            console.log("Server: incorrect answer...");
            setResult("incorrect");
          });

          socket.on("opponent_answer", () => {
            console.log("Opponent answered before you");

            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }

            setIsLocked(true);

            setResult(prev => {
              if (prev) return prev;
              return "opponent-first"; 
            });
          });

          socket.on("game_cancelled", () => {
            console.log("Game cancelled by server")
          })


          type GameFinishedPayload = {
            player: string;
            player_score: number;
            opponent: string;
            opponent_score: number;
          };
          socket.on("game_finished", (data: GameFinishedPayload)  => {

            console.log("Game finished event received");
            console.log("Payload:", data);

            // Let's also print each value explicitly:
            console.log("Player:", data.player);
            console.log("Player Score:", data.player_score);
            console.log("Opponent:", data.opponent);
            console.log("Opponent Score:", data.opponent_score);

            // ✅ store something in localStorage
            localStorage.setItem("testMessage", "Local storage works!");

            // ✅ read the game ID from query string
            const params = new URLSearchParams(window.location.search);
            const gameParam = params.get("game") || "unknown";

            // ✅ redirect to results page with the game query
            //window.location.href = `http://localhost:3000/quiz/quiz-010/multiplayerV2/result?game=${gameParam}`;    
                    
          });
    }

      init();
  },[])


  /* Quiz front handling */
  const [title, setTitle] = useState<string>("");
  const [optionA, setOptionA] = useState<string>("");
  const [optionB, setOptionB] = useState<string>("");
  const [optionC, setOptionC] = useState<string>("");
  const [optionD, setOptionD] = useState<string>("");
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  type ResultState = "correct" | "incorrect" | "opponent-first" | "timeout" | null;
  const [result, setResult] = useState<ResultState>(null);

  const selectAnswer = (answer: string) => {
    if(isLocked) return;
    setSelectedAnswer(answer);
  };
  const getButtonState = (optionLetter: string): "default" | "selected" | "locked" => {
      if (isLocked && selectedAnswer !== optionLetter) return "locked";
      if (selectedAnswer === optionLetter) return "selected";
      return "default";
  };

  function SubmitAnswer() {
    if(!selectedAnswer) return;
    console.log("Submitting answer: " + selectedAnswer)
    const socket = socketRef.current
    if(!socket){
      console.log("Error: socket is null");
      return
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setIsLocked(true);
    let token = getCookie("token");
    socket.emit("submit_answer", {selectedAnswer, token});
  }

    function resetRound() {
    console.log("🔄 Resetting round...");

    // Stop leftover timer intervals
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Reset UI states
    setIsLocked(false);
    setSelectedAnswer(null);
    setResult(null);

    // Reset timer bar to full width (will animate down when timer starts)
    setTimer(100);
  }


  return (
    <main className="flex h-[100vh] justify-center items-center">
      <div className="flex flex-col items-center w-full max-w-xl">
        
        {/* 🟠 Question Title */}
        <div className="flex flex-col">
          <h1
            className="
              text-3xl font-bold text-center break-words 
              leading-snug h-[6rem] flex items-center justify-center
            "
          >
            {title}
          </h1>
        </div>

        {/* Result message */}
        <div>
          <h1
            className={`
              flex justify-center text-4xl font-black pb-5 transition-opacity duration-300
              ${
                result === null
                  ? "invisible opacity-0"
                  : result === "correct"
                    ? "text-green-300 visible opacity-100"
                    : result === "incorrect"
                      ? "text-red-500 visible opacity-100"
                      : result === "timeout"
                        ? "text-red-500 visible opacity-100"
                        : "text-yellow-400 visible opacity-100"
              }
            `}
          >
            {result === "correct" && "Correct answer!"}
            {result === "incorrect" && "Incorrect"}
            {result === "opponent-first" && "Opponent answered first !"}
            {result === "timeout" && "Ran out of time !"}
          </h1>
        </div>


        {/* 🟢 Static timer bar */}
        <div className="w-full h-3 bg-gray-300 rounded overflow-hidden mb-4 mt-4">
          <div
            id="progress-bar"
            className="h-full bg-orange-500 transition-all duration-100"
            style={{ width: `${timer}%` }}
          />
        </div>

        {/* 🟣 Options */}
        <div className="grid grid-cols-2 w-full gap-4">
          <QuizButton
            text={optionA}
            state={getButtonState("a")}
            onClick={() => selectAnswer("a")}
          />
          <QuizButton
            text={optionB}
            state={getButtonState("b")}
            onClick={() => selectAnswer("b")}
          />
          <QuizButton
            text={optionC}
            state={getButtonState("c")}
            onClick={() => selectAnswer("c")}
          />
          <QuizButton
            text={optionD}
            state={getButtonState("d")}
            onClick={() => selectAnswer("d")}
          />
        </div>

        {/* 🔵 Submit button */}
        <div className="flex justify-center mt-10 w-full">
          <SubmitButton
            text="Lock Answer"
            onClick={() => SubmitAnswer()}
            disabled={isLocked}
          />
        </div>

      </div>
    </main>
  );
}
