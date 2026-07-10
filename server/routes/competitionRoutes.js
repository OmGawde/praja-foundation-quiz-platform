const router = require('express').Router();
const Competition = require('../models/Competition');
const Round = require('../models/Round');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Team = require('../models/Team');
const { auth, authorize } = require('../middleware/auth');
const validateObjectId = require('../middleware/validate');

// GET /api/competitions - List all competitions
router.get('/', async (req, res) => {
  try {
    const { archived, active } = req.query;
    const filter = {};
    if (archived === 'true') filter.isArchived = true;
    else if (archived === 'false') filter.isArchived = false;
    if (active === 'true') filter.isActive = true;
    else if (active === 'false') filter.isActive = false;

    const competitions = await Competition.find(filter).sort({ createdAt: -1 });

    // Enrich with round counts and participant counts
    const enriched = await Promise.all(competitions.map(async (comp) => {
      const rounds = await Round.countDocuments({ competitionId: comp._id });
      const roundIds = await Round.find({ competitionId: comp._id }).select('_id');
      const quizzes = await Quiz.countDocuments({ roundId: { $in: roundIds.map(r => r._id) } });
      const quizIds = await Quiz.find({ roundId: { $in: roundIds.map(r => r._id) } }).select('_id');
      const participants = await Team.countDocuments({ quizId: { $in: quizIds.map(q => q._id) } });
      const liveQuizzes = await Quiz.countDocuments({ roundId: { $in: roundIds.map(r => r._id) }, status: 'live' });
      return {
        ...comp.toObject(),
        roundCount: rounds,
        quizCount: quizzes,
        participantCount: participants,
        liveQuizCount: liveQuizzes
      };
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load competitions.' });
  }
});

// GET /api/competitions/overall/analytics - Overall metrics (PRIVATE/ADMIN)
router.get('/overall/analytics', auth, async (req, res) => {
  try {
    // Aggregated accuracy per question index (Q1, Q2, etc.)
    const answers = await Answer.find({});
    const questions = await Question.find({});

    // Map question ID to its order index
    const qMap = {};
    questions.forEach(q => {
      qMap[q._id.toString()] = q.order || 1;
    });

    // Accuracy per question index: index -> { total, correct }
    const indexStats = {};
    for (let i = 1; i <= 10; i++) {
      indexStats[i] = { total: 0, correct: 0 };
    }

    answers.forEach(ans => {
      const qIndex = qMap[ans.questionId.toString()] || 1;
      if (indexStats[qIndex]) {
        indexStats[qIndex].total += 1;
        if (ans.isCorrect) {
          indexStats[qIndex].correct += 1;
        }
      }
    });

    const accuracyTrend = Object.keys(indexStats).map(idx => {
      const { total, correct } = indexStats[idx];
      return {
        label: `Q${idx}`,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0
      };
    });

    // Overall accuracy & response time averages
    const totalAns = answers.length;
    const correctAns = answers.filter(a => a.isCorrect).length;
    const avgAccuracy = totalAns > 0 ? Math.round((correctAns / totalAns) * 100) : 0;

    const totalResponseTime = answers.reduce((sum, a) => sum + (a.responseTime || 0), 0);
    const avgResponseTime = totalAns > 0 ? parseFloat((totalResponseTime / totalAns / 1000).toFixed(1)) : 0;

    res.json({
      accuracyTrend,
      avgAccuracy,
      avgResponseTime
    });
  } catch (err) {
    console.error('Overall analytics error:', err);
    res.status(500).json({ error: 'Failed to load overall analytics.' });
  }
});

// GET /api/competitions/:id/analytics - Specific competition metrics (PRIVATE/ADMIN)
router.get('/:id/analytics', auth, validateObjectId(['id']), async (req, res) => {
  try {
    const compId = req.params.id;

    // Retrieve all children recursively
    const rounds = await Round.find({ competitionId: compId });
    const roundIds = rounds.map(r => r._id);

    const quizzes = await Quiz.find({ roundId: { $in: roundIds } });
    const quizIds = quizzes.map(q => q._id);

    const questions = await Question.find({ quizId: { $in: quizIds } }).sort({ order: 1 });
    const teams = await Team.find({ quizId: { $in: quizIds }, isActive: true }).sort({ score: -1 });

    const qStats = [];
    for (const q of questions) {
      const qAnswers = await Answer.find({ questionId: q._id });
      const total = qAnswers.length;
      const correct = qAnswers.filter(a => a.isCorrect).length;
      const sumTime = qAnswers.reduce((sum, a) => sum + (a.responseTime || 0), 0);

      qStats.push({
        _id: q._id,
        questionText: q.questionText,
        order: q.order,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        avgTime: total > 0 ? parseFloat((sumTime / total / 1000).toFixed(1)) : 0
      });
    }

    res.json({
      questions: qStats,
      teams: teams.map(t => ({
        teamName: t.teamName,
        score: t.score,
        correctAnswers: t.correctAnswers,
        incorrectAnswers: t.incorrectAnswers
      }))
    });
  } catch (err) {
    console.error('Competition analytics error:', err);
    res.status(500).json({ error: 'Failed to load competition analytics.' });
  }
});

// GET /api/competitions/:id - Get single competition
router.get('/:id', validateObjectId(['id']), async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition) return res.status(404).json({ error: 'Competition not found' });

    const rounds = await Round.find({ competitionId: competition._id }).sort({ order: 1 });
    res.json({ ...competition.toObject(), rounds });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load competition.' });
  }
});

// POST /api/competitions - Create competition
router.post('/', auth, async (req, res) => {
  try {
    const competition = new Competition({
      ...req.body,
      createdBy: req.user._id
    });
    await competition.save();
    res.status(201).json(competition);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create competition.' });
  }
});

// PUT /api/competitions/:id - Update competition
router.put('/:id', auth, validateObjectId(['id']), async (req, res) => {
  try {
    const competition = await Competition.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!competition) return res.status(404).json({ error: 'Competition not found' });
    res.json(competition);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update competition.' });
  }
});

// PATCH /api/competitions/:id/archive - Toggle archive
router.patch('/:id/archive', auth, validateObjectId(['id']), async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition) return res.status(404).json({ error: 'Competition not found' });

    competition.isArchived = !competition.isArchived;
    if (competition.isArchived) {
      // Set completedAt when archiving (used for 1-year auto-delete)
      competition.completedAt = new Date();
      competition.isActive = false;
    } else {
      // Clear completedAt when restoring from archive
      competition.completedAt = null;
    }
    await competition.save();
    res.json(competition);
  } catch (error) {
    res.status(400).json({ error: 'Failed to toggle archive.' });
  }
});

// DELETE /api/competitions/:id - Permanently delete competition + all related data
router.delete('/:id', auth, validateObjectId(['id']), async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition) return res.status(404).json({ error: 'Competition not found' });

    // Cascade: find all rounds -> quizzes -> questions, answers, teams
    const rounds = await Round.find({ competitionId: competition._id }).select('_id');
    const roundIds = rounds.map(r => r._id);

    const quizzes = await Quiz.find({ roundId: { $in: roundIds } }).select('_id');
    const quizIds = quizzes.map(q => q._id);

    // Delete answers, teams, questions for all quizzes
    await Answer.deleteMany({ quizId: { $in: quizIds } });
    await Team.deleteMany({ quizId: { $in: quizIds } });
    await Question.deleteMany({ quizId: { $in: quizIds } });

    // Delete quizzes and rounds
    await Quiz.deleteMany({ roundId: { $in: roundIds } });
    await Round.deleteMany({ competitionId: competition._id });

    // Delete competition
    await Competition.findByIdAndDelete(competition._id);

    res.json({ message: 'Competition and all related data permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete competition.' });
  }
});

module.exports = router;
