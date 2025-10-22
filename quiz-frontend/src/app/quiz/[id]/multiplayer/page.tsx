"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket} from "socket.io-client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";

export default function Lobby() {
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
            const res = await fetch("http://localhost:3001/api/auth/register", {
            method: "POST",
            credentials: "include", // important! allows cookie to be set
            });

            const data = await res.json();
            console.log("Registered, backend returned:", data);
            // The cookie is automatically set in the browser via Set-Cookie
            // You don’t need to do anything else
        } catch (err) {
            console.error("Registration failed:", err);
        }
    }

    useEffect(() => {
        // get username from cookie
        let name = document.cookie
            .split("; ")
            .find((row) => row.startsWith("username="))
            ?.split("=")[1] ?? "";
        setUsername(name);

        // Get auth token
        let token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

        console.log("Name is: " + name);
        console.log("Token is: " + token);

        if (!token || !name) {
            // wrap async call in an IIFE since useEffect cannot be async
            console.log("NO token, registering user");
            (async () => {
            await register();
            // reset name and token since they are null now
            name = document.cookie
                .split("; ")
                .find((row) => row.startsWith("username="))
                ?.split("=")[1] ?? "";
            setUsername(name);
            token = document.cookie
                .split("; ")
                .find((row) => row.startsWith("token="))
                ?.split("=")[1];
            })();
        }

        const socket = io("http://localhost:3001");
        socketRef.current = socket;


        socket.on("game_information", ({curQuiz, curGame, curGameId}) => {
            console.log("Received game and quiz information: ")
            console.log(curQuiz)
            setQuizName(curQuiz.name)
            setGameId(curGameId)
            console.log("CUrrent game id: " + curGameId);
            console.log(quizName)
        });

        const params = new URLSearchParams(window.location.search);
        const roomParam = params.get("room");

        socket.on("connect", () => {
            console.log("Connected to socket:", socket.id);

            if (roomParam) {
                console.log("Joining room:", roomParam);
                socket.emit("join_room", { roomId: roomParam, playerName: name, playerToken: token });
            } else {
                console.log("Creating new room...");
                socket.emit("create_room", {playerName: name, playerToken: token, quizId: quizId});
            }
        });

        // When room is successfully created or joined
        socket.on("room_created", ({ gameId }) => {
            console.log("Room created:", gameId);
            setGameId(gameId);

            const { origin, pathname } = window.location;
            const newUrl = `${origin}${pathname}?room=${gameId}`;
            window.history.replaceState(null, "", newUrl);

            // ✅ Now request info
            socket.emit("information", (data: any) => {
                console.log("Received game and quiz information: ")
                console.log(data.curQuiz)
                setQuizName(data.curQuiz.name)
                setGameId(data.curGameId);
                console.log(quizName)
            });

            // And join the new room
            console.log("Joining room: roomid: " + gameId + " name: " + name + " token: " + token )
            socket.emit("join_room", { roomId: gameId, playerName: name, playerToken: token  });
        });

        socket.on("room_joined", ({ players }) => {
            console.log("Joined room with players:", players);

            // ✅ Now request info
            socket.emit("information", (data: any) => {
                console.log("Received game and quiz information: ");
                console.log(data.curQuiz);
                setQuizName(data.curQuiz.name);
                setGameId(data.curGameId);
                console.log("Current game id:  " + data.curGameId);
                console.log(quizName);
            });
        });

        
        socket.on("player_joined", ({opponentName}) => {
            console.log("Player " + opponentName + " joined the room")
            if(opponentName != name)
                setOpponent(opponentName);
        });

                
        socket.on("room_joined", ({players}) => {
            console.log("Joined room " + gameId)
            //console.log("Opponent name: " + opponentName);
            //setOpponent(opponentName);
            console.log(players);
            if(players.length > 0)
                setOpponent(players[0].name)
        });

        socket.on("opponent_left", ({ opponent }) => {
            console.log(opponent + " left the lobby")
            setOpponent(null)
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

        socket.on("game_start", () => {
            setCountdown(null);
            console.log("Game started!");
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
        });

        return () => {
        socket.disconnect();
        };
    }, [router]);


    function readyUp() {
        
        // Update ready state in the backend
        const socket = socketRef.current // Socket | Null
        if(!socket) return;

        console.log("Sending request to server to change player state...")
        type ReadystatePayload = { roomId: string; playerSocket: string; state: boolean };
        socket.emit("readyState", { roomId: gameId, playerSocket: socket.id, state: !playerReady,} as ReadystatePayload);

    }

    

    return (
        <main className="flex flex-col h-[100vh] justify-center items-center">
            <h1 className="text-white text-center font-black text-3xl mb-12">
                Game lobby<br />
                {quizName} Quiz
            </h1>

            <div className="grid grid-cols-3 items-center justify-items-center rounded-xl p-4 text-white w-[60%] gap-y-2">
                {/* Row 1 — names */}
                <div className="text-3xl font-bold text-center">{username}</div>
                <div className="text-5xl font-semibold text-amber-500">VS</div>
                <div className="text-3xl font-bold text-center">
                {opponent ? opponent : "Waiting for opponent..."}
                </div>

                {/* Row 2 — icons */}
                <div>
                <Image
                    src={playerReady ? "/GreenTick.svg" : "/RedX.svg"}
                    alt={playerReady ? "Ready" : "Not Ready"}
                    width={40}
                    height={40}
                    className={`${opponent ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
                />
                </div>

                <div /> {/* empty middle cell */}

                <div>
                <Image
                    src={opponentReady ? "/GreenTick.svg" : "/RedX.svg"}
                    alt={opponentReady ? "Ready" : "Not Ready"}
                    width={40}
                    height={40}
                    className={`${opponent ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
                />
                </div>
            </div>

            <div>
                {/* Always render the room ID container */}
                <p
                className={`text-gray-400 mt-6 transition-opacity duration-300 ${
                    gameId ? "opacity-100" : "opacity-0"
                }`}
                >
                Room ID: <span className="font-mono">{gameId || "••••••••"}</span>
                </p>
            </div>

            <div className="mt-10">
                {/* Always render the button placeholder */}
                <button
                onClick={readyUp}
                disabled={!opponent}
                className={`flex items-center justify-center p-2 rounded-xl text-white font-bold transition-colors cursor-pointer
                    ${
                    playerReady
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-lime-600 hover:bg-lime-700"
                    }
                    ${opponent ? "opacity-100" : "opacity-0 pointer-events-none"} 
                `}
                >
                {playerReady ? "Unready" : "Ready up"}
                </button>
            </div>

            <div className="text-xl py-12 font-bold flex flex-col items-center">
                Game starting in:
                <div
                    className={`text-6xl font-black transition-all duration-300 ${
                    countdown !== null ? "opacity-100 scale-100" : "opacity-0 scale-50"
                    }`}
                >
                    {countdown !== null ? countdown : ""}
                </div>
            </div>

        </main>

    );
}
