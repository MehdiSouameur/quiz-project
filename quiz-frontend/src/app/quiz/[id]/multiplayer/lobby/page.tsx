"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket} from "socket.io-client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

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

interface Quiz {
  quizId: string;
  name: string;
  description: string;
  questions: Question[];
}

export default function Lobby() {

    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        } catch (err) {
        console.error("Failed to copy link: ", err);
        }
    };

    const [username, setUsername] = useState("");
    const [quizName, setQuizName] = useState<string | null>(null);
    const [opponent, setOpponent] = useState<string | null>(null);
    const [gameId, setGameId] = useState<string | null>(null);
    const [playerReady, setPlayerReady] = useState<boolean>(false);
    const [opponentReady, setOpponentReady] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    const pathname = usePathname(); 
    const parts = pathname.split("/"); 
    const quizId = parts[2]; 

    async function register() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: "POST",
            credentials: "include", // important! allows cookie to be set
            });

            const data = await res.json();
            const { token, username } = data;

            console.log("Registered, backend returned:", data);

            if (token) {
            document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
            }
            if (username) {
            document.cookie = `username=${encodeURIComponent(
                username
            )}; path=/; max-age=${60 * 60 * 24 * 7}`;
            }
            
        } catch (err) {
            console.error("Registration failed:", err);
        }
    }


    function getCookie(name: string): string | null {
        return (
            document.cookie
            .split("; ")
            .find((row) => row.startsWith(name + "="))
            ?.split("=")[1] || null
        );
    }
    function readyUp() {
        const socket = socketRef.current;
        if(!socket) return;
        console.log("Sending request to server to change player state...")
        type ReadystatePayload = { roomId: string; playerSocket: string; state: boolean };
        socket.emit("readyState", { roomId: gameId, playerSocket: socket.id, state: !playerReady,} as ReadystatePayload);

    }

    useEffect(() => {
        const init = async () => {
            let name = getCookie("username");
            let token = getCookie("token");

            if (!name || !token) {
                console.log("No username/token found, registering user...");
                await register();
                name = getCookie("username");
                token = getCookie("token");

                console.log("Username registered: " + name)
                console.log("Token registered: " + token)
            }

            setUsername(name ?? "");
            console.log("Username read: " + name)
            const params = new URLSearchParams(window.location.search);
            let roomParam = params.get("room");
            const socket = io(`${API_BASE_URL}/lobby`, {
                auth: { token: token },
            });
            socketRef.current = socket;

            socket.on("connect", () => {
                console.log("✅ Connected to lobby:", socket.id);
                // Check if we're trying to join an existing room from url, otherwise create a room

                if (roomParam) {
                    console.log("Joining room:", roomParam);
                    socket.emit("join_room", { roomId: roomParam, playerName:  name, playerToken: token });
                } else {
                    console.log("Creating new room...");
                    socket.emit("create_room", {playerName: name, playerToken: token, quizId: quizId});
                }
            });

            socket.on("room_created", ({ _roomId }) => {
                roomParam = _roomId;
                console.log("Room sent from backend:", _roomId);
                console.log("Adding query string room=" + _roomId);
                const { origin, pathname } = window.location;
                const newUrl = `${origin}${pathname}?room=${_roomId}`;
                window.history.replaceState(null, "", newUrl);

                // And join the new room

                console.log("Joining room: roomid: " + _roomId + " name: " + name + " token: " + token )
                socket.emit("join_room", { roomId: _roomId, playerName: name, playerToken: token  });

            });

            socket.on("information_response", ({ quizData }) => {
                console.log("Quiz received: ");
                console.log(quizData)
                setQuizName(quizData.name)
            })

            socket.on("room_joined", ({ players }) => {
                console.log("Joined room with players:", players);
                if(players.length > 0)
                    setOpponent(players[0].name)
                if(roomParam){
                    console.log("Requesting information about room")
                    socket.emit("get_information", { _roomId: roomParam });
                    setGameId(roomParam);
                } else {
                    console.log("No room ID found, Creating new room...");
                    socket.emit("create_room", {playerName: name, playerToken: token, quizId: quizId});
                }
                
            });

            socket.on("player_joined", ({ opponentName }) => {
                console.log("Player " + opponentName + " joined the room")
                if(opponentName != name)
                    setOpponent(opponentName);
            });

            socket.on("opponent_left", ({ opponent }) => {
                console.log(opponent + " left the lobby")
                setOpponent(null);
                setOpponentReady(false);
                type ReadystatePayload = { roomId: string; playerSocket: string; state: boolean };
                socket.emit("readyState", { roomId: roomParam, playerSocket: socket.id, state: false} as ReadystatePayload);
            });

            type ReadyClientPayload = { state: boolean}
            socket.on("readyClient", ({ state }: ReadyClientPayload) => {
                console.log("Server -> Player is ready: " + state)
                setPlayerReady(state)
            });

            socket.on("readyOpponent", ({ state }: ReadyClientPayload) => {
                console.log("Server -> Opponent is ready: " + state)
                setOpponentReady(state)
            });

            type CountdownType = { countdown: number}
            socket.on("countdown_tick", ({ countdown }: CountdownType) => {
                console.log("Commencing countdown: " + countdown)
                setCountdown(countdown);
            })

            socket.on("countdown_cancelled", () => {
                setCountdown(null);

            });

            type GameStartType = {roomId: string}
            socket.on("game_start", ({ roomId }: GameStartType) => {
                setCountdown(null);
                console.log("Game started!");

                if (socket.connected) {
                    socket.disconnect();
                    console.log("🔌 Disconnected from lobby namespace");
                }
                router.push(`/quiz/${quizId}/multiplayer/play?game=${roomId}`)
            });

        }

        init();
    
        return () => {

        };
    }, [router]);    

    return (
        <main className="flex flex-col min-h-screen justify-center items-center px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-white text-center font-black text-2xl sm:text-3xl md:text-4xl mb-6 sm:mb-1">
            Game lobby
            <br />
            <span className="text-lg sm:text-2xl md:text-3xl font-semibold">
            {quizName} Quiz
            </span>
        </h1>

        <div className="flex flex-row mb-4">
            <div className="text-blue-400 text-sm md:text-base">
                Share this link with a friend to get started:
            </div>
            <button
                type="button"
                className="text-xs ml-2 px-1 border rounded bg-blue-700 cursor-pointer"
                onClick={handleCopy}
            >
                {copied ? "COPIED!" : "COPY LINK"}
            </button>
        </div>

        <div
            className="
            grid grid-cols-3 items-center justify-items-center
            rounded-xl
            w-full max-w-md sm:max-w-xl
            p-3 sm:p-4 md:p-6
            text-white
            gap-y-2 sm:gap-y-3
            border border-white/10 bg-white/5
            "
        >
            {/* Row 1 — names */}
            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-center break-words px-1">
            {username}
            </div>

            <div className="text-3xl sm:text-4xl md:text-5xl font-semibold text-amber-500">
            VS
            </div>

            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-center break-words px-1">
            {opponent ? opponent : "Waiting for opponent..."}
            </div>

            {/* Row 2 — icons */}
            <div className="mt-2 sm:mt-3">
                <div className="scale-75 sm:scale-90 md:scale-100">
                <Image
                    src={playerReady ? "/GreenTick.svg" : "/RedX.svg"}
                    alt={playerReady ? "Ready" : "Not Ready"}
                    width={40}
                    height={40}
                    className={`${opponent ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
                />
                </div>
            </div>

            <div /> {/* empty middle cell */}

            <div className="mt-2 sm:mt-3">
                <div className="scale-75 sm:scale-90 md:scale-100">
                <Image
                    src={opponentReady ? "/GreenTick.svg" : "/RedX.svg"}
                    alt={opponentReady ? "Ready" : "Not Ready"}
                    width={40}
                    height={40}
                    className={`${opponent ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
                />
                </div>
            </div>
        </div>

        {/* Room ID */}
        <div>
            <p
            className={`
                text-xs sm:text-sm md:text-base text-gray-400 mt-4 sm:mt-6
                transition-opacity duration-300 text-center
                ${gameId ? "opacity-100" : "opacity-0"}
            `}
            >
            Room ID:{" "}
            <span className="font-mono bg-black/40 px-2 py-1 rounded-md">
                {gameId || "••••••••"}
            </span>
            </p>
        </div>

        {/* Ready button */}
        <div className="mt-6 sm:mt-8 w-full flex justify-center">
            <button
            onClick={readyUp}
            disabled={!opponent}
            className={`
                w-50 md:w-full max-w-xs
                flex items-center justify-center
                px-4 py-2 sm:px-5 sm:py-3
                rounded-xl text-white font-bold text-sm sm:text-base
                transition-colors cursor-pointer
                ${playerReady ? "bg-red-600 hover:bg-red-700" : "bg-lime-600 hover:bg-lime-700"}
                ${opponent ? "opacity-100" : "opacity-0 pointer-events-none"}
            `}
            >
            {playerReady ? "Unready" : "Ready up"}
            </button>
        </div>

        {/* Countdown */}
        <div
            className={`
            text-center text-base sm:text-lg md:text-xl py-6 sm:py-8 font-bold
            flex flex-col items-center
            transition-all duration-300 transform
            ${countdown !== null ? "opacity-100 scale-100" : "opacity-0 scale-50"}
            `}
        >
            Game starting in:
            <div className="text-4xl sm:text-5xl md:text-6xl font-black mt-2">
            {countdown !== null ? countdown : ""}
            </div>
        </div>
        </main>

    );
}
