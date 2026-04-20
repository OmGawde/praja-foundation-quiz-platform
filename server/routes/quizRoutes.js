const router = require('express').Router();
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Team = require('../models/Team');
const { auth } = require('../middleware/auth');
const generateJoinCode = require('../utils/generateJoinCode');

// GET /api/quizzes - List quizzes (with roundId filter)
router.get('/', async (req, res) => {
  try {
    const { roundId, status } = req.query;
    const filter = {};
    if (roundId) filter.roundId = roundId;
    if (status) filter.status = status;

    const quizzes = await Quiz.find(filter)
      .sort({ createdAt: -1 })
      .populate('roundId', 'name competitionId');

    const enriched = await Promise.all(quizzes.map(async (quiz) => {
      const questionCount = await Question.countDocuments({ quizId: quiz._id });
      const teamCount = await Team.countDocuments({ quizId: quiz._id, isActive: true });
      return {
        ...quiz.toObject(),
        questionCount,
        teamCount
      };
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── STATIC ROUTES MUST COME BEFORE /:id ROUTES ───

// GET /api/quizzes/join/:joinCode - Validate join code (public)
router.get('/join/:joinCode', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ joinCode: req.params.joinCode })
      .populate({
        path: 'roundId',
        populate: { path: 'competitionId', select: 'name' }
      });

    if (!quiz) {
      return res.status(404).json({ error: 'Invalid join code' });
    }
    if (quiz.status === 'ended') {
      return res.status(400).json({ error: 'This quiz has already ended' });
    }
    if (quiz.status === 'live') {
      return res.status(400).json({ error: 'This quiz is already in progress. Cannot join now.' });
    }

    const teamCount = await Team.countDocuments({ quizId: quiz._id, isActive: true });
    if (teamCount >= quiz.maxTeams) {
      return res.status(400).json({ error: 'This quiz is full' });
    }

    res.json({
      quizId: quiz._id,
      title: quiz.title,
      joinCode: quiz.joinCode,
      status: quiz.status,
      maxTeams: quiz.maxTeams,
      currentTeams: teamCount,
      roundName: quiz.roundId?.name,
      competitionName: quiz.roundId?.competitionId?.name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/quizzes/:id - Get single quiz with details
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('roundId', 'name competitionId order');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const questions = await Question.find({ quizId: quiz._id }).sort({ order: 1 });
    const teams = await Team.find({ quizId: quiz._id, isActive: true }).sort({ score: -1, totalResponseTime: 1 });
    const questionCount = questions.length;
    const teamCount = teams.length;

    res.json({ ...quiz.toObject(), questions, teams, questionCount, teamCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/quizzes - Create quiz
router.post('/', auth, async (req, res) => {
  try {
    const joinCode = await generateJoinCode();
    const quiz = new Quiz({
      ...req.body,
      joinCode
    });
    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/quizzes/:id/duplicate - Duplicate quiz
router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const originalQuiz = await Quiz.findById(req.params.id);
    if (!originalQuiz) return res.status(404).json({ error: 'Quiz not found' });

    const joinCode = await generateJoinCode();

    // Create new quiz
    const newQuiz = new Quiz({
      roundId: originalQuiz.roundId,
      title: req.body.title || `${originalQuiz.title} (Copy)`,
      joinCode,
      maxTeams: originalQuiz.maxTeams,
      status: 'lobby'
    });
    await newQuiz.save();

    // Copy questions but NOT teams or results
    const questions = await Question.find({ quizId: originalQuiz._id });
    for (const q of questions) {
      const newQuestion = new Question({
        quizId: newQuiz._id,
        type: q.type,
        questionText: q.questionText,
        mediaUrl: q.mediaUrl,
        options: [...q.options],
        correctAnswerIndex: q.correctAnswerIndex,
        timeLimit: q.timeLimit,
        order: q.order
      });
      await newQuestion.save();
    }

    res.status(201).json(newQuiz);
  } catch (error) {
    console.error('Duplicate quiz error:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/quizzes/:id - Update quiz
router.put('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (quiz.status === 'live') {
      return res.status(400).json({ error: 'Cannot edit a live quiz' });
    }

    Object.assign(quiz, req.body);
    await quiz.save();
    res.json(quiz);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/quizzes/:id/archive - Toggle archive
router.patch('/:id/archive', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    quiz.isArchived = !quiz.isArchived;
    await quiz.save();
    res.json(quiz);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
