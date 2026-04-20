const router = require('express').Router();
const Round = require('../models/Round');
const Quiz = require('../models/Quiz');
const Team = require('../models/Team');
const { auth } = require('../middleware/auth');

// GET /api/rounds - List rounds (with competitionId filter)
router.get('/', async (req, res) => {
  try {
    const { competitionId } = req.query;
    const filter = {};
    if (competitionId) filter.competitionId = competitionId;

    const rounds = await Round.find(filter).sort({ order: 1 }).populate('competitionId', 'name');

    const enriched = await Promise.all(rounds.map(async (round) => {
      const quizzes = await Quiz.countDocuments({ roundId: round._id });
      const quizIds = await Quiz.find({ roundId: round._id }).select('_id');
      const participants = await Team.countDocuments({ quizId: { $in: quizIds.map(q => q._id) } });
      const liveQuizzes = await Quiz.countDocuments({ roundId: round._id, status: 'live' });
      return {
        ...round.toObject(),
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

// GET /api/rounds/:id - Get single round
router.get('/:id', async (req, res) => {
  try {
    const round = await Round.findById(req.params.id).populate('competitionId', 'name');
    if (!round) return res.status(404).json({ error: 'Round not found' });

    const quizzes = await Quiz.find({ roundId: round._id });
    res.json({ ...round.toObject(), quizzes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/rounds - Create round
router.post('/', auth, async (req, res) => {
  try {
    const { competitionId, name } = req.body;

    // Auto-assign next order
    const lastRound = await Round.findOne({ competitionId }).sort({ order: -1 });
    const order = lastRound ? lastRound.order + 1 : 1;

    const round = new Round({ competitionId, name, order });
    await round.save();
    res.status(201).json(round);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/rounds/:id - Update round
router.put('/:id', auth, async (req, res) => {
  try {
    const round = await Round.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!round) return res.status(404).json({ error: 'Round not found' });
    res.json(round);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/rounds/reorder - Reorder rounds
router.put('/reorder/batch', auth, async (req, res) => {
  try {
    const { rounds } = req.body; // [{ id, order }]
    await Promise.all(rounds.map(({ id, order }) =>
      Round.findByIdAndUpdate(id, { order })
    ));
    res.json({ message: 'Rounds reordered successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/rounds/:id - Delete round
router.delete('/:id', auth, async (req, res) => {
  try {
    const round = await Round.findByIdAndDelete(req.params.id);
    if (!round) return res.status(404).json({ error: 'Round not found' });
    res.json({ message: 'Round deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
