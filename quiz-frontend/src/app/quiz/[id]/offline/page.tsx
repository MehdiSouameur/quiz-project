"use client"

import { useState, useEffect, useRef } from "react";
import QuizButton from "../../../components/QuizButton";

import { useRouter, useParams } from "next/navigation";
import SubmitButton from "../../../components/SubmitButton";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

interface Option {
  id: string | number;
  text: string;
}

interface Question {
  id: number;
  title: string;
  options: Option[];
}

interface QuizData {
  gameId: string;
  currentQuestionIndex: number;
  question: Question;
  questions: Question[];
  score: number;
  isFinished: boolean;
}


export default function Quiz() {
  
  const router = useRouter();
  const startCalledRef = useRef(false);
  
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const selectedAnswerRef = useRef<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [timeLeft, setTimeLeft] = useState(100); // percentage
  const totalTime = 20; // seconds
  const progressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nextQuestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { id } = useParams();
  const quizId = id as string;

  const startQuiz = async () => {
    console.log("starting quiz");
    const res = await fetch(`${API_BASE_URL}/api/quiz/start/${quizId}`);
    const data = await res.json();
    setQuizData(data);
    router.push(`/quiz/${quizId}/offline?gameId=${data.gameId}`);
  };

  // Start Quiz
  useEffect(() => {
    if (!startCalledRef.current) {
      startQuiz();
      startCalledRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!quizData) return;

    // clear timers
    if (progressTimeoutRef.current) clearTimeout(progressTimeoutRef.current);
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);

    // 1️⃣ instantly reset the bar without transition
    const bar = document.getElementById("progress-bar");
    if (bar) {
      bar.style.transition = "none";   // disable transition
      bar.style.width = "100%";        // fill instantly
    }

    // 2️⃣ small delay before starting the transition
    progressTimeoutRef.current = setTimeout(() => {
      if (bar) {
        bar.style.transition = `width ${totalTime}s linear`; // re-enable transition
        bar.style.width = "0%";  // animate to 0%
      }
    }, 50);

    // auto-evaluate when time runs out
    finishTimeoutRef.current = setTimeout(() => {
      evaluateQuestion(true);
    }, totalTime * 1000);

    return () => {
      if (progressTimeoutRef.current) clearTimeout(progressTimeoutRef.current);
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    };
  }, [quizData?.question?.id]);



  if (!quizData) return <p>Loading...</p>;


  const evaluateQuestion = async (auto = false) => {
    const answer = selectedAnswerRef.current;
    console.log("current answer is: " + answer)
    if (!answer && !auto) return;

    // freeze bar
    const bar = document.getElementById("progress-bar");
    if (bar) {
      const computedWidth = window.getComputedStyle(bar).width;
      bar.style.transition = "none";
      bar.style.width = computedWidth;
    }

    console.log("payload", { gameId: quizData?.gameId, questionId: quizData?.question.id, answer });
    console.log("Posting...", `${API_BASE_URL}/api/quiz/evaluate`);
    const res = await fetch(`${API_BASE_URL}/api/quiz/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId: quizData?.gameId,
        questionId: quizData?.question.id,
        answer: answer ?? null,
      }),
    });

    console.log("Received!");


    const data = await res.json();
    setCorrectAnswer(data.answer);
    setShowResults(true);

    // clear any existing timers before setting next
    if (progressTimeoutRef.current) clearTimeout(progressTimeoutRef.current);
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    if (nextQuestionTimeoutRef.current) clearTimeout(nextQuestionTimeoutRef.current);

    // after 2s → move to next question
    nextQuestionTimeoutRef.current = setTimeout(() => {
      goToNextQuestion(data);
    }, 2000);
  };


  const goToNextQuestion = (data?: any) => {
    // 1️⃣ Clear all timers
    if (progressTimeoutRef.current) clearTimeout(progressTimeoutRef.current);
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    if (nextQuestionTimeoutRef.current) clearTimeout(nextQuestionTimeoutRef.current);

    // 2️⃣ Reset states
    setSelectedAnswer(null);
    setCorrectAnswer(null);
    setShowResults(false);
    selectedAnswerRef.current = null;
    setTimeLeft(100); // reset progress bar

    // 3️⃣ Update question last
    if (data?.question) {
      setQuizData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          score: data?.score ?? prev.score,
          question: data.question,
        };
      });
    } else {
      router.push(`/quiz/${id}/offline/result?gameId=${data.gameId}`); // game finished
    }
  };



  const selectAnswer = (answer: string) => {
    if (!showResults) {
      setSelectedAnswer(answer); // lock answers once results are showing
      selectedAnswerRef.current = answer;
      console.log("Selected answer: " + selectedAnswer)
    }
  };

  const getButtonState = (optionLetter: string): "default" | "selected" | "correct" | "incorrect" => {
    if (!showResults) {
      return selectedAnswer === optionLetter ? "selected" : "default";
    }
    if (correctAnswer === optionLetter) return "correct";
    if (selectedAnswer === optionLetter && correctAnswer !== optionLetter) return "incorrect";
    return "default";
  };

  return (
      <main className="flex min-h-screen justify-center items-center px-10 py-10">
        <div className="flex flex-col items-center w-full max-w-lg md:max-w-xl space-y-4">

          {/* Question */}
          <div className="flex flex-col">
            <h1
              className="
                text-center font-bold break-words leading-tight
                text-xl sm:text-xl md:text-2xl 
                min-h-[4rem] flex items-center justify-center
              "
            >
              {quizData.question.title}
            </h1>
          </div>

          {/* Result Feedback */}
          <h1
            className={`
              text-center text-xl sm:text-2xl md:text-3xl font-black transition-opacity duration-300
              ${showResults
                ? correctAnswer === selectedAnswer
                  ? "text-green-300 opacity-100"
                  : "text-red-500 opacity-100"
                : "opacity-0"
              }
            `}
          >
            {correctAnswer === selectedAnswer ? "Correct answer!" : "Wrong answer!"}
          </h1>

          {/* Progress Bar */}
          <div className="h-2 bg-gray-300 rounded overflow-hidden w-60 sm:w-70 md:w-90 mb-10">
            <div id="progress-bar" className="h-full bg-orange-500" style={{ width: "100%" }}/>
          </div>

          {/* Options Grid */}
          <div className="flex justify-center mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 w-full gap-3 sm:gap-4">
              <QuizButton
                text={quizData.question.options[0].text}
                state={getButtonState("a")}
                onClick={() => selectAnswer("a")}
              />
              <QuizButton
                text={quizData.question.options[1].text}
                state={getButtonState("b")}
                onClick={() => selectAnswer("b")}
              />
              <QuizButton
                text={quizData.question.options[2].text}
                state={getButtonState("c")}
                onClick={() => selectAnswer("c")}
              />
              <QuizButton
                text={quizData.question.options[3].text}
                state={getButtonState("d")}
                onClick={() => selectAnswer("d")}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center w-full">
            <SubmitButton 
              text="Lock Answer" 
              onClick={() => evaluateQuestion(false)} 
            />
          </div>

        </div>
      </main>

  );
}
