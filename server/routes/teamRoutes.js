const router = require('express').Router();
const Team = require('../models/Team');
const Quiz = require('../models/Quiz');
const { auth } = require('../middleware/auth');

// POST /api/teams/register - Register team with join code (PUBLIC)
router.post('/register', async (req, res) => {
  try {
    const { teamName, participant1, participant2, institute, email, phone, joinCode } = req.body;

    // Find quiz by join code
    const quiz = await Quiz.findOne({ joinCode });
    if (!quiz) {
      return res.status(404).json({ error: 'Invalid join code' });
    }

    // Check quiz status
    if (quiz.status === 'live') {
      return res.status(400).json({ error: 'Cannot join a quiz that is already live' });
    }
    if (quiz.status === 'ended') {
      return res.status(400).json({ error: 'This quiz has already ended' });
    }

    // Check if team limit reached
    const teamCount = await Team.countDocuments({ quizId: quiz._id, isActive: true });
    if (teamCount >= quiz.maxTeams) {
      return res.status(400).json({ error: 'This quiz is full. No more teams can join.' });
    }

    // Check if this join code was already used by another team with same email
    const existingTeam = await Team.findOne({
      quizId: quiz._id,
      email: email.toLowerCase(),
      isActive: true
    });
    if (existingTeam) {
      return res.status(400).json({ error: 'A team with this email has already registered for this quiz' });
    }

    // Create team
    const team = new Team({
      teamName,
      participant1,
      participant2,
      institute,
      email,
      phone,
      quizId: quiz._id,
      joinCodeUsed: joinCode
    });
    await team.save();

    res.status(201).json({
      team,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        status: quiz.status,
        joinCode: quiz.joinCode
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/teams - List teams for a quiz
router.get('/', async (req, res) => {
  try {
    const { quizId } = req.query;
    if (!quizId) return res.status(400).json({ error: 'quizId is required' });

    const teams = await Team.find({ quizId, isActive: true })
      .sort({ score: -1, totalResponseTime: 1 });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/teams/:id - Get single team
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('quizId', 'title joinCode status maxTeams')
      .populate({
        path: 'answers',
        populate: { path: 'questionId', select: 'questionText options correctAnswerIndex type mediaUrl' }
      });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/teams/:id/remove - Deactivate team
router.patch('/:id/remove', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    team.isActive = false;
    await team.save();

    // Notify via socket if available
    const io = req.app.get('io');
    if (io) {
      io.to(`quiz_${team.quizId}`).emit('teamRemoved', {
        teamId: team._id,
        teamName: team.teamName
      });
    }

    res.json({ message: 'Team removed successfully', team });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
