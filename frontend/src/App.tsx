import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import QuizLogin from './components/QuizLogin';
import QuizQuestion from './components/QuizQuestion';
import Leaderboard from './components/Leaderboard';

// Define the types for better type safety
interface User {
  score: number;
}

interface Question {
  id: number;
  question: string;
  choices: string[];
}

// Establish connection with backend
const socket = io('http://localhost:5000', {
  transports: ['websocket'],
});

const quizId = "123";

const App = () => {
  const [userId, setUserId] = useState<string>('');
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [leaderboard, setLeaderboard] = useState<{ [key: string]: User }>({});
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);

  useEffect(() => {
    socket.on('userJoined', (data: { users: { [key: string]: User } }) => {
      setUsers(data.users);
    });

    socket.on('leaderboardUpdate', (data: { users: { [key: string]: User } }) => {
      setLeaderboard(data.users);
    });

    socket.on('newQuestion', (question: Question) => {
      setCurrentQuestion(question);
      setTimeLeft(10); 
      setIsWaiting(false); 
      setIsTimeUp(false); 
    });

    socket.on('timeLeft', (data: { timeLeft: number }) => {
      setTimeLeft(data.timeLeft);
      if (data.timeLeft <= 0) {
        setIsTimeUp(true); 
      }
    });

    socket.on('waitingForOthers', () => {
      if (!quizFinished) {
        setIsWaiting(true); 
      }
    });

    socket.on('quizFinished', (data: { message: string, users: { [key: string]: User } }) => {
      setQuizFinished(true);
      setUsers(data.users); 
      setIsWaiting(false); 
    });

    return () => {
      socket.off('userJoined');
      socket.off('leaderboardUpdate');
      socket.off('newQuestion');
      socket.off('timeLeft');
      socket.off('waitingForOthers');
      socket.off('quizFinished');
    };
  }, [quizFinished]);

  const joinQuiz = () => {
    socket.emit('joinQuiz', { quizId, userId });
    setIsJoined(true);
  };

  const submitAnswer = () => {
    if (selectedAnswer !== null && currentQuestion && !isTimeUp) {
      socket.emit('submitAnswer', { quizId, userId, questionId: currentQuestion.id, selectedAnswer });
      setSelectedAnswer(null);
      setIsWaiting(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Real-time Quiz</h1>
      {!isJoined && !quizFinished && (
        <QuizLogin userId={userId} setUserId={setUserId} joinQuiz={joinQuiz} isJoined={isJoined} />
      )}
      {currentQuestion && !quizFinished && !isWaiting && (
        <QuizQuestion
          currentQuestion={currentQuestion}
          selectedAnswer={selectedAnswer}
          setSelectedAnswer={setSelectedAnswer}
          submitAnswer={submitAnswer}
          timeLeft={timeLeft}
          isTimeUp={isTimeUp}
        />
      )}
      {!quizFinished && isWaiting && (
        <div className="text-center">
          <p className="text-xl font-semibold">Waiting for others to submit...</p>
        </div>
      )}
      {quizFinished && (
        <div className="text-center">
          <h2 className="text-2xl font-bold">Quiz Finished!</h2>
          <p>Your score: {users[userId]?.score || 0}</p>
        </div>
      )}
      <Leaderboard leaderboard={leaderboard} />
    </div>
  );
};

export default App;
