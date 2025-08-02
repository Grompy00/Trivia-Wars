import { useEffect, useState, useContext, useRef } from "react";
import "./index.css"; 
import { QuestionContext } from "./QuestionCount";
import { LobbyCodeContext } from "./LobbyCodeContext"; 
import { useSocket } from "./SocketContext";
import { DisplayNameContext } from "./DisplayNameContext";
import { useNavigate } from "react-router-dom";

function Game() {
  const socket = useSocket();
  const { joinCode } = useContext(LobbyCodeContext);
  const { displayName } = useContext(DisplayNameContext);
  const { setInputValue } = useContext(QuestionContext);
  const autoNextTimeoutRef = useRef(null);
  const navigate = useNavigate();

  const [questionInfo, setQuestionInfo] = useState(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null); 
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [wasSubmitButtonClicked, setWasSubmitButtonClicked] = useState(false);
  const [submitButtonText, setSubmitButtonText] = useState('Submit');
  const [gameState, setGameState] = useState('Answer Question');
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(1);
  const [timer, setTimer] = useState(10);
  const [finalScores, setFinalScores] = useState(null);
  const [liveScores, setLiveScores] = useState(null);
  const { inputValue } = useContext(QuestionContext);

  // Listen for socket events
  useEffect(() => {
    if (!socket || !socket.connected || !joinCode || !displayName) return;

    socket.emit('join_room', joinCode, displayName);

    socket.on('new_question', (question) => {
      setQuestionInfo(question);
      setSelectedAnswerIndex(null);
      setCorrectAnswer(null);
      setWasSubmitButtonClicked(false);
      setSubmitButtonText('Submit');
      setGameState('Answer Question');
      setTimer(10);
      setQuestionCount(question.questionNumber);
      if (question.questionLimit) setInputValue(question.questionLimit);
    });

    socket.on('answer_result', ({ name, correct }) => {
      if (name === displayName && correct) {
        setScore((prev) => prev + 1);
      }
    });

    socket.on('game_over', (scores) => {
      setFinalScores(scores);
    });

    socket.on('scores_update', (scores) => {
      setLiveScores(scores);
    });

    return () => {
      socket.off('new_question');
      socket.off('answer_result');
      socket.off('game_over');
      socket.off('scores_update');
    };
  }, [socket, joinCode, displayName]);

  // Timer countdown for each question
  useEffect(() => {
    if (gameState !== 'Answer Question' || !questionInfo) return;

    setTimer(10);
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [questionInfo, gameState]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timer === 0 && gameState === 'Answer Question') {
      handleAutoSubmit();
    }
  }, [timer, gameState]);

  // Clear auto-next timeout when a new question arrives
  useEffect(() => {
    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }
  }, [questionInfo]);

  // Conditional render AFTER all hooks
  if (!questionInfo) {
    return <div>Loading question...</div>;
  }

  if (questionCount > parseInt(inputValue)) {
    // Find winner(s) if you want
    let winnerText = "";
    if (finalScores) {
      const maxScore = Math.max(...Object.values(finalScores));
      const winners = Object.entries(finalScores)
        .filter(([name, score]) => score === maxScore)
        .map(([name]) => name);
      winnerText = `Winner${winners.length > 1 ? "s" : ""}: ${winners.join(", ")} (${maxScore} point${maxScore !== 1 ? "s" : ""})`;
    }

    return (
      <div className={`game-container${true ? " game-over" : ""}`}>
        <h1>Game Over!</h1>
        <h2>Your Score: {score}</h2>
        {winnerText && <h2>{winnerText}</h2>}
        {finalScores && (
          <div>
            <h3>Final Scores:</h3>
            <ul>
              {Object.entries(finalScores).map(([player, score]) => (
                <li key={player}>{player}: {score}</li>
              ))}
            </ul>
          </div>
        )}
        <button
          className="gameButton"
          onClick={() => socket.emit('restart_game', joinCode)}
          style={{ marginTop: "2em", padding: "1em 2em", fontSize: "1.2em" }}
        >
          Play Again
        </button>
      </div>
    );
  }

  function handleAutoSubmit() {
    if (
      !questionInfo ||
      !Array.isArray(questionInfo.questionChoices) ||
      typeof questionInfo.questionAnswer === "undefined"
    ) {
      return;
    }

    const selectedAnswer = selectedAnswerIndex !== null
      ? questionInfo.questionChoices[selectedAnswerIndex]
      : null;

    socket.emit('submit_answer', {
      roomCode: joinCode,
      name: displayName,
      answer: selectedAnswer,
    });

    setCorrectAnswer(questionInfo.questionChoices.indexOf(questionInfo.questionAnswer));
    setWasSubmitButtonClicked(true);
    setSubmitButtonText('Next Question');
    setGameState('New Question');

    // Clear any previous timeout before setting a new one
    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }
    autoNextTimeoutRef.current = setTimeout(() => {
      socket.emit('next_question', joinCode);
      setQuestionCount((prev) => prev + 1);
    }, 5000);
  }

  return (
    <div className={`game-container${false ? " game-over" : ""}`}>
      <div className="game-top-row">
        <div className="question-heading">
          Question {questionInfo.questionNumber} of {questionInfo.questionLimit}
        </div>
        {(liveScores || finalScores) && (
          <div className="leaderboard leaderboard-top-right">
            <h2>Scoreboard</h2>
            <ul>
              {Object.entries(liveScores || finalScores)
                .sort((a, b) => b[1] - a[1])
                .map(([player, playerScore]) => (
                  <li key={player}>
                    {player}: {playerScore}
                    {player === displayName ? " (You)" : ""}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
      <div className="question">{questionInfo.question}</div>

      {questionInfo.questionChoices && Array.isArray(questionInfo.questionChoices) ? (
        questionInfo.questionChoices.map((choice, i) => (
          <div
            id={
              i === 0 ? "answer-one" :
              i === 1 ? "answer-two" :
              i === 2 ? "answer-three" :
              i === 3 ? "answer-four" : undefined
            }
            className={`answer ${selectedAnswerIndex === i ? "selected" : ""} ${correctAnswer === i && wasSubmitButtonClicked ? 'correct' : ""} ${correctAnswer !== i && wasSubmitButtonClicked && selectedAnswerIndex === i ? 'incorrect' : ""}`}
            onClick={() => setSelectedAnswerIndex(i)}
            key={i}
          >
            <h1>{choice}</h1>
          </div>
        ))
      ) : (
        <div>No answer choices available.</div>
      )}

      <div className="timer">Time left: {timer}</div>
    </div>
  );
}

export default Game;
