"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function Lobby() {
    const [username, setUsername] = useState("");
    const [quizName, setQuizName] = useState<string | null>(null);
    const [opponent, setOpponent] = useState<string | null>(null);
    const [gameId, setGameId] = useState<string | null>(null);
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
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];

        if (!token || !name) {
            // wrap async call in an IIFE since useEffect cannot be async
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
                .find((row) => row.startsWith("authToken="))
                ?.split("=")[1];
            })();
        }

        const roomParam = searchParams.get("room"); // get room id from query string if present

        const socket = io("http://localhost:3001");


        socket.on("game_information", ({curQuiz, curGame}) => {
            console.log("Received game and quiz information: ")
            console.log(curQuiz)
            setQuizName(curQuiz.name)
            console.log(quizName)
        });

        socket.on("connect", () => {
            console.log("Connected to socket:", socket.id);

            const payload = { playerName: name, playerToken: token };

            if (roomParam) {
                console.log("Joining room:", roomParam);
                socket.emit("join_room", { roomId: roomParam, ...payload });
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
                console.log(quizName)
            });
        });

        socket.on("room_joined", ({ players }) => {
            console.log("Joined room with players:", players);

            // ✅ Now request info
            socket.emit("information", (data: any) => {
                console.log("Received game and quiz information: ")
                console.log(data.curQuiz)
                setQuizName(data.curQuiz.name)
                console.log(quizName)
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

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
        });

        return () => {
        socket.disconnect();
        };
    }, [router]);

    return (
        <main className="flex flex-col h-[100vh] justify-center items-center">
        <h1 className="text-white text-center font-black text-3xl mb-12">
            Game lobby<br></br>{quizName} Quiz
        </h1>
        <div className="flex items-center justify-center rounded-xl p-4 text-white w-[60%]">
            <div className="flex-1 text-left text-3xl font-black">
            {username}
            </div>
            <div className="px-20 text-5xl font-semibold text-amber-500">vs</div>
            <div className="flex-1 text-right text-3xl font-bold">
                {opponent ? opponent : "Waiting for opponent..."}
            </div>
        </div>
        {gameId && (
            <p className="text-gray-400 mt-6">
            Room ID: <span className="font-mono">{gameId}</span>
            </p>
        )}
        </main>
    );
}
