import React from 'react';

interface User {
  score: number;
}

interface LeaderboardProps {
  leaderboard: { [key: string]: User };
}

const Leaderboard: React.FC<LeaderboardProps> = ({ leaderboard }) => {
  return (
    <>
      <h2 className="text-xl font-bold mt-6">Leaderboard</h2>
      <ul>
        {Object.entries(leaderboard)
          .sort(([, userA], [, userB]) => userB.score - userA.score)
          .map(([key, user]) => (
            <li key={key}>
              User {key}: {user.score} points
            </li>
          ))}
      </ul>
    </>
  );
};

export default Leaderboard;
