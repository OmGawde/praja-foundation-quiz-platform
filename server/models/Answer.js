const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  selectedOption: {
    type: Number,
    required: true,
    min: 0
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  responseTime: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Compound unique index: one answer per team per question
answerSchema.index({ teamId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('Answer', answerSchema);
