const router = require('express').Router();
const Question = require('../models/Question');
const { auth } = require('../middleware/auth');
const { uploadExcel } = require('../middleware/upload');
const XLSX = require('xlsx');
const fs = require('fs');

// GET /api/questions - List questions for a quiz
router.get('/', async (req, res) => {
  try {
    const { quizId } = req.query;
    if (!quizId) return res.status(400).json({ error: 'quizId is required' });

    const questions = await Question.find({ quizId }).sort({ order: 1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/questions/:id - Get single question
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/questions - Create single question
router.post('/', auth, async (req, res) => {
  try {
    // Auto-assign order
    const lastQuestion = await Question.findOne({ quizId: req.body.quizId }).sort({ order: -1 });
    const order = lastQuestion ? lastQuestion.order + 1 : 1;

    const question = new Question({ ...req.body, order });
    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/questions/:id - Update question
router.put('/:id', auth, async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!question) return res.status(404).json({ error: 'Question not found' });
    res.json(question);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/questions/:id - Delete question
router.delete('/:id', auth, async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/questions/bulk-upload - Upload Excel file to create questions
router.post('/bulk-upload', auth, uploadExcel.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (!req.body.quizId) return res.status(400).json({ error: 'quizId is required' });

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    // Get current max order
    const lastQuestion = await Question.findOne({ quizId: req.body.quizId }).sort({ order: -1 });
    let currentOrder = lastQuestion ? lastQuestion.order + 1 : 1;

    const questions = [];
    for (const row of data) {
      // Expected columns: questionText, type, option1, option2, option3, option4, correctAnswer, timeLimit, mediaUrl
      const options = [
        row.option1 || row.Option1 || '',
        row.option2 || row.Option2 || '',
        row.option3 || row.Option3 || '',
        row.option4 || row.Option4 || ''
      ].filter(o => o !== '');

      const correctAnswer = parseInt(row.correctAnswer || row.CorrectAnswer || '0');

      const question = new Question({
        quizId: req.body.quizId,
        questionText: row.questionText || row.QuestionText || row.question || row.Question || '',
        type: row.type || row.Type || 'text',
        options,
        correctAnswerIndex: correctAnswer,
        timeLimit: parseInt(row.timeLimit || row.TimeLimit || '30'),
        mediaUrl: row.mediaUrl || row.MediaUrl || '',
        order: currentOrder++
      });

      await question.save();
      questions.push(question);
    }

    // Cleanup uploaded file
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      message: `${questions.length} questions uploaded successfully`,
      questions
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
