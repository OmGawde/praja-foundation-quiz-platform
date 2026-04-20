const router = require('express').Router();
const Competition = require('../models/Competition');
const Round = require('../models/Round');
const Quiz = require('../models/Quiz');
const Team = require('../models/Team');
const { auth } = require('../middleware/auth');

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
    res.status(500).json({ error: error.message });
  }
});

// GET /api/competitions/:id - Get single competition
router.get('/:id', async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition) return res.status(404).json({ error: 'Competition not found' });

    const rounds = await Round.find({ competitionId: competition._id }).sort({ order: 1 });
    res.json({ ...competition.toObject(), rounds });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/competitions/:id - Update competition
router.put('/:id', auth, async (req, res) => {
  try {
    const competition = await Competition.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!competition) return res.status(404).json({ error: 'Competition not found' });
    res.json(competition);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/competitions/:id/archive - Toggle archive
router.patch('/:id/archive', auth, async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition) return res.status(404).json({ error: 'Competition not found' });

    competition.isArchived = !competition.isArchived;
    await competition.save();
    res.json(competition);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/competitions/:id - Delete competition
router.delete('/:id', auth, async (req, res) => {
  try {
    const competition = await Competition.findByIdAndDelete(req.params.id);
    if (!competition) return res.status(404).json({ error: 'Competition not found' });
    res.json({ message: 'Competition deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
