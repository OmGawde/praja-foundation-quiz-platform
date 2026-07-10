const router = require('express').Router();
const { auth } = require('../middleware/auth');
const validateObjectId = require('../middleware/validate');
const { generateCompetitionCSV, generateRoundCSV, generateQuizCSV } = require('../utils/csvGenerator');

// GET /api/csv/competition/:id
router.get('/competition/:id', auth, validateObjectId(['id']), async (req, res) => {
  try {
    const csv = await generateCompetitionCSV(req.params.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=competition_${req.params.id}_report.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate competition CSV.' });
  }
});

// GET /api/csv/round/:id
router.get('/round/:id', auth, validateObjectId(['id']), async (req, res) => {
  try {
    const csv = await generateRoundCSV(req.params.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=round_${req.params.id}_report.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate round CSV.' });
  }
});

// GET /api/csv/quiz/:id
router.get('/quiz/:id', auth, validateObjectId(['id']), async (req, res) => {
  try {
    const csv = await generateQuizCSV(req.params.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=quiz_${req.params.id}_report.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate quiz CSV.' });
  }
});

module.exports = router;
