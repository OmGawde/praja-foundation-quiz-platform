const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { generateCompetitionCSV, generateRoundCSV, generateQuizCSV } = require('../utils/csvGenerator');

// GET /api/csv/competition/:id
router.get('/competition/:id', auth, async (req, res) => {
  try {
    const csv = await generateCompetitionCSV(req.params.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=competition_${req.params.id}_report.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/csv/round/:id
router.get('/round/:id', auth, async (req, res) => {
  try {
    const csv = await generateRoundCSV(req.params.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=round_${req.params.id}_report.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/csv/quiz/:id
router.get('/quiz/:id', auth, async (req, res) => {
  try {
    const csv = await generateQuizCSV(req.params.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=quiz_${req.params.id}_report.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
