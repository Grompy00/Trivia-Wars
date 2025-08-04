const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { getDataFromDatabase } = require('./database');

const app = express();
app.use(cors({
  origin: ['https://triviawars.xyz', 'https://grompy00.github.io', 'https://www.triviawars.xyz'],
  methods: ['GET', 'POST'],
  credentials: true
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['https://triviawars.xyz', 'https://grompy00.github.io', 'https://www.triviawars.xyz'],
    methods: ['GET', 'POST']
  }
});
app.get('/health', (req, res) => res.sendStatus(200));


let allQuestions = [];
const playersByRoom = {};
const questionsAskedByRoom = {};
const currentQuestionByRoom = {};
const scoresByRoom = {};

(async () => {
  allQuestions = await getDataFromDatabase();
})();

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getNextQuestion(roomCode) {
  const asked = questionsAskedByRoom[roomCode] || [];
  const categories = playersByRoom[roomCode]?.categories || ["All"];
  let filteredQuestions = Array.isArray(allQuestions) ? allQuestions : [];

  if (!categories.includes("All")) {
    const selectedLower = categories.map(c => c.toLowerCase());
    filteredQuestions = filteredQuestions.filter(q =>
      q.category && selectedLower.includes(q.category.toLowerCase())
    );
  }

  // Prevent crash if no questions available
  if (!filteredQuestions.length) {
    return null;
  }

  let index;
  let tries = 0;
  do {
    index = Math.floor(Math.random() * filteredQuestions.length);
    tries++;
    if (tries > filteredQuestions.length) break; // Prevent infinite loop
  } while (
    asked.includes(index) &&
    asked.length < filteredQuestions.length
  );

  questionsAskedByRoom[roomCode] = [...asked, index];
  const rawQuestion = filteredQuestions[index];
  if (!rawQuestion) return null; // Prevent crash

  // Get choices and correct answer
  const choices = rawQuestion.choices || rawQuestion.questionChoices;
  const correct = rawQuestion.answer || rawQuestion.questionAnswer;

  // Shuffle choices
  const shuffledChoices = shuffleArray([...choices]);

  const question = {
    question: rawQuestion.question,
    questionChoices: shuffledChoices,
    questionAnswer: correct,
    questionNumber: questionsAskedByRoom[roomCode].length,
    questionLimit: playersByRoom[roomCode].questionLimit || 10,
    category: rawQuestion.category
  };
  currentQuestionByRoom[roomCode] = question;
  return question;
}
io.on('connection', (socket) => {
  socket.on('create_lobby', (roomCode, displayName, questionLimit, categories = ["All"]) => {
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.displayName = displayName;
    playersByRoom[roomCode] = {
      members: [displayName],
      questionLimit: parseInt(questionLimit) || 10,
      categories: categories // store array
    };
    questionsAskedByRoom[roomCode] = [];
    scoresByRoom[roomCode] = {};
    scoresByRoom[roomCode][displayName] = 0;
    io.to(roomCode).emit('update_players', playersByRoom[roomCode].members);
    io.to(roomCode).emit('scores_update', scoresByRoom[roomCode]);
  });

  socket.on('join_room', (roomCode, displayName) => {
    if (!displayName || typeof displayName !== "string" || displayName.trim() === "") {
      // Optionally, send an error to the client
      return;
    }
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.displayName = displayName;
    if (!playersByRoom[roomCode]) {
      playersByRoom[roomCode] = { members: [], questionLimit: 10 };
    }
    if (!playersByRoom[roomCode].members.includes(displayName)) {
      playersByRoom[roomCode].members.push(displayName);
    }
    if (!scoresByRoom[roomCode]) scoresByRoom[roomCode] = {};
    scoresByRoom[roomCode][displayName] = 0;

    io.to(roomCode).emit('update_players', playersByRoom[roomCode].members);
    io.to(roomCode).emit('scores_update', scoresByRoom[roomCode]);

    if (currentQuestionByRoom[roomCode]) {
      socket.emit('new_question', currentQuestionByRoom[roomCode]);
    }
  });

  socket.on('start_game', (roomCode) => {
    const question = getNextQuestion(roomCode);
    if (!question) {
      io.to(roomCode).emit('error', 'No questions available for the selected categories.');
      return;
    }
    const questionLimit = playersByRoom[roomCode].questionLimit || 10;
    if (question.questionNumber > questionLimit) {
      io.to(roomCode).emit('game_over', scoresByRoom[roomCode]);
    } else {
      io.to(roomCode).emit('new_question', question);
      io.to(roomCode).emit('redirect_to_game');
    }
  });

  socket.on('submit_answer', ({ roomCode, answer, name }) => {
    const correctAnswer = currentQuestionByRoom[roomCode]?.questionAnswer;
    const isCorrect = answer === correctAnswer;
    console.log('submit_answer:', { roomCode, answer, name, correctAnswer, isCorrect });
    if (isCorrect) {
      scoresByRoom[roomCode][name] = (scoresByRoom[roomCode][name] || 0) + 1;
    }
    io.to(roomCode).emit('answer_result', { name, correct: isCorrect });
    io.to(roomCode).emit('scores_update', scoresByRoom[roomCode]); // <--- Add this line
  });

  socket.on('next_question', (roomCode) => {
    const question = getNextQuestion(roomCode);
    const questionLimit = playersByRoom[roomCode].questionLimit || 10;
    if (question.questionNumber > questionLimit) {
      io.to(roomCode).emit('game_over', scoresByRoom[roomCode]);
    } else {
      io.to(roomCode).emit('new_question', question);
      io.to(roomCode).emit('redirect_to_game');
    }
  });

  socket.on('check_room_exists', (roomCode, callback) => {
    const exists = !!playersByRoom[roomCode];
    callback(exists);
  });

  // When the game ends (after last question)
  socket.on('end_game', (roomCode) => {
    const scores = scoresByRoom[roomCode];
    io.to(roomCode).emit('game_over', scores);
  });

  socket.on('restart_game', (roomCode) => {
    // Reset questions and scores for the room
    questionsAskedByRoom[roomCode] = [];
    Object.keys(scoresByRoom[roomCode]).forEach(name => {
      scoresByRoom[roomCode][name] = 0;
    });
    // Send first question
    const question = getNextQuestion(roomCode);
    io.to(roomCode).emit('scores_update', scoresByRoom[roomCode]);
    io.to(roomCode).emit('new_question', question);
  });
});


const PORT = process.env.PORT || 8080;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
