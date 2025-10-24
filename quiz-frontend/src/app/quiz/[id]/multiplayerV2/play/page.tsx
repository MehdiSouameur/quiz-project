"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket} from "socket.io-client";
import QuizButton from "@/app/components/QuizButton";
import SubmitButton from "@/app/components/SubmitButton";

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

          console.log("Joining Game: " + gameParam)
          socket.emit("join_game", {_gameId: gameParam, _playerName: name, _playerToken: token})

          socket.on("game_joined", () => {
            console.log("Server response: Game joined!")
          })


          socket.on("game_cancelled", () => {
            console.log("Game cancelled by server")
          })
    }

      init();
  },[])


  /* Quiz front handling */
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const selectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
  };
  const getButtonState = (optionLetter: string): "default" | "selected" => {
    return selectedAnswer === optionLetter ? "selected" : "default";
  };

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
            Sample Question: What is the capital of France?
          </h1>
        </div>

        {/* 🟢 Static progress bar */}
        <div className="w-full h-3 bg-gray-300 rounded overflow-hidden mb-4 mt-4">
          <div
            id="progress-bar"
            className="h-full bg-orange-500 transition-all duration-500"
            style={{ width: "60%" }} // just static for now
          />
        </div>

        {/* 🟣 Options */}
        <div className="grid grid-cols-2 w-full gap-4">
          <QuizButton
            text="Paris"
            state={getButtonState("a")}
            onClick={() => selectAnswer("a")}
          />
          <QuizButton
            text="London"
            state={getButtonState("b")}
            onClick={() => selectAnswer("b")}
          />
          <QuizButton
            text="Berlin"
            state={getButtonState("c")}
            onClick={() => selectAnswer("c")}
          />
          <QuizButton
            text="Madrid"
            state={getButtonState("d")}
            onClick={() => selectAnswer("d")}
          />
        </div>

        {/* 🔵 Submit button */}
        <div className="flex justify-center mt-10 w-full">
          <SubmitButton
            text="Lock Answer"
            onClick={() => console.log("Answer locked")}
          />
        </div>

      </div>
    </main>
  );
}
