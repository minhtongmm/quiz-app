import React from 'react';

interface Question {
  id: number;
  question: string;
  choices: string[];
}

interface QuizQuestionProps {
  currentQuestion: Question;
  selectedAnswer: number | null;
  setSelectedAnswer: (value: number | null) => void;
  submitAnswer: () => void;
  timeLeft: number;
  isTimeUp: boolean;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  currentQuestion,
  selectedAnswer,
  setSelectedAnswer,
  submitAnswer,
  timeLeft,
  isTimeUp,
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-xl mb-2">Question: {currentQuestion.question}</h2>
      <ul className="mb-4">
        {currentQuestion.choices.map((choice, index) => (
          <li key={index} className="mb-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="answer"
                value={index}
                checked={selectedAnswer === index}
                onChange={() => setSelectedAnswer(index)}
                className="mr-2"
              />
              {choice}
            </label>
          </li>
        ))}
      </ul>
      <button
        className={`bg-green-500 text-white p-2 rounded w-full ${isTimeUp ? 'opacity-50' : ''}`}
        onClick={submitAnswer}
        disabled={isTimeUp}
      >
        {isTimeUp ? 'Time Up' : 'Submit Answer'}
      </button>
      <p className="mt-2">Time left: {timeLeft}s</p>
    </div>
  );
};

export default QuizQuestion;
