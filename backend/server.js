const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const redis = require("redis");

const redisHost = process.env.REDIS_HOST || "redis";
const redisPort = process.env.REDIS_PORT || 6379;

const questions = [
  {
    id: 1,
    question: "Which of the following sentences is grammatically correct?",
    choices: [
      "She don’t like apples.",
      "She doesn’t likes apples.",
      "She doesn’t like apples.",
      "She don’t likes apples.",
    ],
    correctAnswerIndex: 2,
  },
  {
    id: 2,
    question: 'What is the correct past tense form of the verb "go"?',
    choices: ["Goed", "Went", "Go", "Going"],
    correctAnswerIndex: 1,
  },
  {
    id: 3,
    question:
      'Which sentence uses the correct form of "their", "there", or "they’re"?',
    choices: [
      "Their going to the park.",
      "There going to the park.",
      "They’re going to the park.",
      "Their going to their park.",
    ],
    correctAnswerIndex: 2,
  },
  {
    id: 4,
    question:
      "Which of the following is a correct example of a comparative adjective?",
    choices: [
      "She is more taller than her brother.",
      "She is taller than her brother.",
      "She is the most taller than her brother.",
      "She is as taller as her brother.",
    ],
    correctAnswerIndex: 1,
  },
];

const redisClient = redis.createClient({
  host: redisHost,
  port: redisPort,
});
const redisSubscriber = redis.createClient({
  host: redisHost,
  port: redisPort,
});

const quizData = {
  quizId: "123",
  users: {},
  questions 
};

let questionSubmissions = {}; // Tracks user submissions
let timer = null;
let timeLimit = 10;
let joinedUsers = 0;
let currentQuestionIndex = 0;
const requiredUsers = 2; // Modify as needed

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Helper function to start a question with a countdown
function startQuestion(io, questionIndex) {
  const question = quizData.questions[questionIndex];

  if (question) {
    questionSubmissions = {}; // Reset submissions for new question
    io.to(quizData.quizId).emit("newQuestion", question); // Emit question to users

    let timeLeft = timeLimit;
    io.to(quizData.quizId).emit("timeLeft", { timeLeft }); // Emit initial time

    timer = setInterval(() => {
      timeLeft--;
      io.to(quizData.quizId).emit("timeLeft", { timeLeft });

      if (timeLeft <= 0) {
        clearInterval(timer);
        moveToNextQuestion(io);
      }
    }, 1000);
  }
}

// Function to move to the next question or finish the quiz
function moveToNextQuestion(io) {
  currentQuestionIndex++;

  if (currentQuestionIndex < quizData.questions.length) {
    startQuestion(io, currentQuestionIndex);
  } else {
    io.to(quizData.quizId).emit("quizFinished", {
      message: "Quiz Finished!",
      users: quizData.users,
    });
  }
}

function handleSubmission(io, userId, questionId, selectedAnswer) {
  const question = quizData.questions.find((q) => q.id === questionId);

  if (question && question.correctAnswerIndex === selectedAnswer) {
    quizData.users[userId].score += 10; // Correct answer

    // Publish the score update to the Redis `scoreUpdates` channel
    redisClient.publish(
      "scoreUpdates",
      JSON.stringify({
        quizId: quizData.quizId,
        userId: userId,
        score: quizData.users[userId].score,
      })
    );
  }

  questionSubmissions[userId] = true;

  const allUsersSubmitted = Object.keys(quizData.users).every(
    (user) => questionSubmissions[user]
  );

  if (allUsersSubmitted) {
    clearInterval(timer);
    moveToNextQuestion(io);
  } else {
    io.to(userId).emit("waitingForOthers");
  }
}


// Socket.IO logic
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("joinQuiz", ({ quizId, userId }) => {
    if (quizId === quizData.quizId) {
      socket.join(quizId);
      quizData.users[userId] = quizData.users[userId] || { score: 0 };
      joinedUsers++;

      io.to(quizId).emit("userJoined", { users: quizData.users });

      // If the quiz is already finished, notify the user
      if (currentQuestionIndex >= quizData.questions.length) {
        socket.emit("quizFinished", {
          message: "Quiz Finished!",
          users: quizData.users,
        });
      } else if (joinedUsers === requiredUsers) {
        startQuestion(io, currentQuestionIndex); // Start quiz when all users join
      }
    } else {
      socket.emit("error", "Invalid quiz ID");
    }
  });

  socket.on(
    "submitAnswer",
    ({ quizId, userId, questionId, selectedAnswer }) => {
      handleSubmission(io, userId, questionId, selectedAnswer);
    }
  );
});

// Redis Pub/Sub for score updates
redisSubscriber.subscribe("scoreUpdates");
redisSubscriber.on("message", (channel, message) => {
  if (channel === "scoreUpdates") {
    const { quizId, userId, score } = JSON.parse(message);
    io.to(quizId).emit("leaderboardUpdate", {
      userId,
      score,
      users: quizData.users,
    });
  }
});

// Start the server
server.listen(5000, () => {
  console.log("Quiz backend is running on port 5000");
});
