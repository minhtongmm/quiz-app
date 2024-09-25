import React from 'react';

interface QuizLoginProps {
  userId: string;
  setUserId: (value: string) => void;
  joinQuiz: () => void;
  isJoined: boolean;
}

const QuizLogin: React.FC<QuizLoginProps> = ({ userId, setUserId, joinQuiz, isJoined }) => {
  return (
    <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
      <input
        className="mb-4 p-2 border border-gray-300 rounded w-full"
        type="text"
        placeholder="Enter User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        disabled={isJoined}
      />
      <button
        className={`mb-4 ${isJoined ? 'bg-gray-400' : 'bg-blue-500'} text-white p-2 rounded w-full`}
        onClick={joinQuiz}
        disabled={isJoined}
      >
        {isJoined ? 'Waiting for others...' : 'Join Quiz'}
      </button>
    </div>
  );
};

export default QuizLogin;
