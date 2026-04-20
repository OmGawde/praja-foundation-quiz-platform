const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Team = require('../models/Team');
const Answer = require('../models/Answer');
const shuffle = require('../utils/shuffle');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ─── JOIN QUIZ (Team joins lobby) ───
    socket.on('joinQuiz', async ({ quizId, teamId }) => {
      try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return socket.emit('error', { message: 'Quiz not found' });

        const team = await Team.findById(teamId);
        if (!team) return socket.emit('error', { message: 'Team not found' });

        // Join socket room
        socket.join(`quiz_${quizId}`);
        team.socketId = socket.id;
        await team.save();

        // Get all active teams in this quiz
        const teams = await Team.find({ quizId, isActive: true })
          .select('teamName participant1 participant2 institute score')
          .sort({ createdAt: 1 });

        // Broadcast updated team list to entire room
        io.to(`quiz_${quizId}`).emit('teamJoined', {
          teams,
          newTeam: { teamName: team.teamName, teamId: team._id }
        });

        // Send quiz info to joining team
        socket.emit('quizInfo', {
          quizId: quiz._id,
          title: quiz.title,
          status: quiz.status,
          joinCode: quiz.joinCode
        });

        console.log(`👥 Team "${team.teamName}" joined quiz ${quizId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // ─── ADMIN JOINS QUIZ ROOM ───
    socket.on('adminJoinQuiz', ({ quizId }) => {
      socket.join(`quiz_${quizId}`);
      console.log(`🔑 Admin joined quiz room ${quizId}`);
    });

    // ─── START QUIZ (Admin only) ───
    socket.on('startQuiz', async ({ quizId }) => {
      try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return socket.emit('error', { message: 'Quiz not found' });
        if (quiz.status !== 'lobby') return socket.emit('error', { message: 'Quiz is not in lobby state' });

        // Get questions
        const questions = await Question.find({ quizId });
        if (questions.length === 0) return socket.emit('error', { message: 'No questions in this quiz' });

        quiz.status = 'live';
        quiz.questionStartTime = new Date(); // Using this as global start, individual timers will be handled by client
        await quiz.save();

        // Assign randomized question order to each team
        const teams = await Team.find({ quizId, isActive: true });
        for (const team of teams) {
          team.questionOrder = shuffle(questions.map(q => q._id));
          team.currentQuestionIndex = 0;
          await team.save();
        }

        // Broadcast quiz started (clients will respond by requesting their personalized first question)
        io.to(`quiz_${quizId}`).emit('quizStarted', {
          totalQuestions: questions.length
        });

        console.log(`🎮 Quiz ${quizId} STARTED. Teams getting randomized questions.`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // ─── SUBMIT ANSWER ───
    socket.on('submitAnswer', async ({ quizId, teamId, questionId, selectedOption }) => {
      try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz || quiz.status !== 'live') {
          return socket.emit('error', { message: 'Quiz is not live' });
        }

        const team = await Team.findById(teamId);
        if (!team) return socket.emit('error', { message: 'Team not found' });

        // Check if question is the current question for this specific team
        const currentQuestionId = team.questionOrder[team.currentQuestionIndex];
        if (currentQuestionId.toString() !== questionId) {
          return socket.emit('error', { message: 'This question is no longer active' });
        }

        // Timer enforcement is now handled by the client due to async pacing
        const question = await Question.findById(questionId);
        // Calculate response time roughly
        const elapsed = (Date.now() - new Date(quiz.questionStartTime).getTime()) / 1000;
        const responseTime = Math.round(elapsed * 1000); // in ms
        const existingAnswer = await Answer.findOne({ teamId, questionId });
        if (existingAnswer) {
          return socket.emit('answerReceived', {
            status: 'duplicate',
            message: 'Answer already submitted for this question'
          });
        }

        // calculate response time was done above


        // Check correctness
        const isCorrect = selectedOption === question.correctAnswerIndex;

        // Save answer
        const answer = new Answer({
          teamId,
          questionId,
          quizId,
          selectedOption,
          isCorrect,
          responseTime
        });
        await answer.save();

        // Update team score
        if (isCorrect) {
          team.correctAnswers += 1;
          team.score += 10; // base score per correct answer
        } else {
          team.incorrectAnswers += 1;
        }
        team.totalResponseTime += responseTime;
        await team.save();

        // Confirm to submitting team
        socket.emit('answerReceived', {
          status: 'accepted',
          isCorrect,
          responseTime
        });

        // Broadcast updated leaderboard
        await broadcastLeaderboard(io, quizId);

        console.log(`📝 Team "${team.teamName}" answered Q${team.currentQuestionIndex + 1}: ${isCorrect ? '✅' : '❌'}`);
      } catch (error) {
        if (error.code === 11000) {
          socket.emit('answerReceived', {
            status: 'duplicate',
            message: 'Answer already submitted'
          });
        } else {
          socket.emit('error', { message: error.message });
        }
      }
    });



    // ─── FORCE END QUIZ (Admin) ───
    socket.on('forceEndQuiz', async ({ quizId }) => {
      try {
        await endQuiz(io, quizId);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // ─── FETCH NEXT QUESTION (Participant self-paced) ───
    socket.on('fetchNextQuestion', async ({ quizId, teamId }) => {
      try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz || quiz.status !== 'live') {
          return socket.emit('error', { message: 'Quiz is not live' });
        }

        const team = await Team.findById(teamId);
        if (!team) return socket.emit('error', { message: 'Team not found' });

        // Mark current question as unattempted if they didn't answer
        const currentQId = team.questionOrder[team.currentQuestionIndex];
        if (currentQId) {
          const answered = await Answer.findOne({ teamId: team._id, questionId: currentQId });
          if (!answered) {
            team.unattempted += 1;
          }
        }

        const nextIndex = team.currentQuestionIndex + 1;

        if (nextIndex >= team.questionOrder.length) {
          // Team finished all questions
          team.currentQuestionIndex = nextIndex;
          await team.save();

          socket.emit('quizEnded', {
            leaderboard: await getLeaderboard(quizId)
          });

          // Check if ALL teams finished
          const allTeams = await Team.find({ quizId, isActive: true });
          const allDone = allTeams.every(t => t.currentQuestionIndex >= t.questionOrder.length);
          if (allDone) {
            await endQuiz(io, quizId);
          }

          return;
        }

        // Advance team to next question
        team.currentQuestionIndex = nextIndex;
        await team.save();

        const nextQuestion = await Question.findById(team.questionOrder[nextIndex]);
        const safeQuestion = sanitizeQuestion(nextQuestion, nextIndex, team.questionOrder.length);

        // Get correct answer for previous question
        const prevQuestion = await Question.findById(currentQId);

        socket.emit('nextQuestion', {
          question: safeQuestion,
          previousAnswer: prevQuestion ? {
            questionId: currentQId,
            correctAnswerIndex: prevQuestion.correctAnswerIndex,
            correctAnswerText: prevQuestion.options[prevQuestion.correctAnswerIndex]
          } : null
        });

        // Broadcast updated leaderboard to admin
        await broadcastLeaderboard(io, quizId);

        console.log(`⏭️ Team "${team.teamName}" moved to Q${nextIndex + 1}`);
      } catch (error) {
        console.error('fetchNextQuestion error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // ─── TAB SWITCH DETECTION ───
    socket.on('tabSwitch', ({ quizId, teamId }) => {
      console.log(`⚠️ Tab switch detected: Team ${teamId} in Quiz ${quizId}`);
    });

    // ─── REQUEST CURRENT QUESTION (for late joiners / page transitions) ───
    socket.on('requestCurrentQuestion', async ({ quizId, teamId }) => {
      try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return;

        if (quiz.status === 'ended') {
          return socket.emit('currentQuestion', { status: 'ended' });
        }

        if (quiz.status === 'live') {
          const team = await Team.findById(teamId);
          if (!team || !team.questionOrder || team.questionOrder.length === 0) return;

          if (team.currentQuestionIndex >= team.questionOrder.length) {
            return socket.emit('currentQuestion', { status: 'ended' });
          }

          const currentQuestionId = team.questionOrder[team.currentQuestionIndex];
          const question = await Question.findById(currentQuestionId);
          if (!question) return;

          const safeQuestion = sanitizeQuestion(question, team.currentQuestionIndex, team.questionOrder.length);

          // Return dummy remaining time since client enforces its own self-paced timer, limit is just for UI
          const remainingTime = question.timeLimit;

          socket.emit('currentQuestion', {
            question: safeQuestion,
            remainingTime,
            status: 'live'
          });

          console.log(`📡 Sent current question to socket ${socket.id} (Q${team.currentQuestionIndex + 1})`);
        } else if (quiz.status === 'lobby') {
          socket.emit('currentQuestion', { status: 'lobby', question: null });
        }
      } catch (error) {
        console.error('requestCurrentQuestion error:', error.message);
      }
    });

    // ─── DISCONNECT ───
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

// ─── HELPER: Sanitize question (remove correct answer & shuffle options) ───
function sanitizeQuestion(question, index, total) {
  // Shuffle options and retain their original indexes
  const optionsWithIndex = question.options.map((text, i) => ({ text, originalIndex: i }));
  const shuffledOptions = shuffle(optionsWithIndex);

  return {
    _id: question._id,
    questionText: question.questionText,
    type: question.type,
    mediaUrl: question.mediaUrl,
    options: shuffledOptions,
    timeLimit: question.timeLimit,
    questionNumber: index + 1,
    totalQuestions: total
  };
}



// ─── HELPER: End quiz ───
async function endQuiz(io, quizId) {

  const quiz = await Quiz.findById(quizId);
  if (!quiz) return;

  quiz.status = 'ended';
  await quiz.save();

  // Get final leaderboard
  const teams = await Team.find({ quizId, isActive: true })
    .sort({ correctAnswers: -1, totalResponseTime: 1 })
    .select('teamName score correctAnswers incorrectAnswers unattempted totalResponseTime');

  // Get last question's correct answer for this team
  let lastQuestion = null;
  let lastQuestionId = null;
  
  if (teams.length > 0) {
    // We arbitrarily pick the team's last question but since the quiz is ended, we won't broadcast a global "previousAnswer" accurately for everyone if they all had different last questions.
    // Instead we'll just omit it or rely on the client's own history.
  }

  io.to(`quiz_${quizId}`).emit('quizEnded', {
    leaderboard: teams,
    previousAnswer: null
  });

  console.log(`🏁 Quiz ${quizId} ENDED. Winner: ${teams[0]?.teamName || 'N/A'}`);
}

// ─── HELPER: Get leaderboard ───
async function getLeaderboard(quizId) {
  return await Team.find({ quizId, isActive: true })
    .sort({ correctAnswers: -1, totalResponseTime: 1 })
    .select('teamName score correctAnswers incorrectAnswers unattempted totalResponseTime');
}

// ─── HELPER: Broadcast leaderboard ───
async function broadcastLeaderboard(io, quizId) {
  const teams = await Team.find({ quizId, isActive: true })
    .sort({ correctAnswers: -1, totalResponseTime: 1 })
    .select('teamName score correctAnswers totalResponseTime institute');

  io.to(`quiz_${quizId}`).emit('leaderboardUpdate', { leaderboard: teams });
}
