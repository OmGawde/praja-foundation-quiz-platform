require('dotenv').config();
const mongoose = require('mongoose');
const Quiz = require('./models/Quiz');
const Question = require('./models/Question');
const Team = require('./models/Team');
const User = require('./models/User');

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('connected to DB');

    // Find any quiz
    let quiz = await Quiz.findOne({ status: 'lobby' });
    if (!quiz) {
      // Create a test quiz
      const testRound = await mongoose.model('Round').findOne() || new (mongoose.model('Round'))({ name: 'Test Round', competitionId: new mongoose.Types.ObjectId() });
      await testRound.save();

      quiz = new Quiz({
        title: 'Test Debug Quiz',
        roundId: testRound._id,
        joinCode: 'DEBUG123',
        maxTeams: 10,
        status: 'lobby'
      });
      await quiz.save();
    }

    console.log('Quiz:', quiz.title, 'Status:', quiz.status, 'ID:', quiz._id);

    // Make sure it has at least 1 question
    let question = await Question.findOne({ quizId: quiz._id });
    if (!question) {
      question = new Question({
        quizId: quiz._id,
        questionText: 'What is 2 + 2?',
        options: ['2', '4', '6', '8'],
        correctAnswerIndex: 1,
        type: 'text',
        timeLimit: 30,
        order: 1
      });
      await question.save();
    }
    console.log('Question:', question.questionText, 'Options:', question.options);

    // Register a test team
    let team = await Team.findOne({ quizId: quiz._id });
    if (!team) {
      team = new Team({
        teamName: 'Debug Team',
        participant1: 'Leader',
        institute: 'Debug school',
        email: 'debug@test.com',
        quizId: quiz._id,
        joinCodeUsed: quiz.joinCode
      });
      await team.save();
    }
    console.log('Team ID:', team._id);

    // Mock starting the quiz (simulate the server socket startQuiz logic)
    const questions = await Question.find({ quizId: quiz._id });
    const shuffle = require('./utils/shuffle');

    quiz.status = 'live';
    quiz.questionStartTime = new Date();
    await quiz.save();

    team.questionOrder = shuffle(questions.map(q => q._id));
    team.currentQuestionIndex = 0;
    await team.save();

    console.log('Quiz updated to Live. Team questionOrder assigned:', team.questionOrder);

    // Mock requestCurrentQuestion payload
    const currentQuestionId = team.questionOrder[team.currentQuestionIndex];
    const currentQ = await Question.findById(currentQuestionId);
    console.log('Current Question from DB:', currentQ);

    const optionsWithIndex = currentQ.options.map((text, i) => ({ text, originalIndex: i }));
    console.log('Mapped Options (this is what is passed to shuffle):', optionsWithIndex);

    const shuffledOptions = shuffle(optionsWithIndex);
    console.log('Shuffled Options:', shuffledOptions);

    const safeQuestion = {
      _id: currentQ._id,
      questionText: currentQ.questionText,
      type: currentQ.type,
      mediaUrl: currentQ.mediaUrl,
      options: shuffledOptions,
      timeLimit: currentQ.timeLimit,
      questionNumber: team.currentQuestionIndex + 1,
      totalQuestions: team.questionOrder.length
    };

    console.log('SUCCESS! Safe Question Payload generated for Client:', safeQuestion);
    process.exit(0);
  } catch (err) {
    console.error('TEST FAILED WITH ERROR:', err);
    process.exit(1);
  }
};

runTest();
