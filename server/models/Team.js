const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true
  },
  participant1: {
    type: String,
    required: [true, 'Participant 1 name is required'],
    trim: true
  },
  participant2: {
    type: String,
    default: '',
    trim: true
  },
  institute: {
    type: String,
    required: [true, 'Institute is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: [true, 'Quiz ID is required']
  },
  joinCodeUsed: {
    type: String,
    required: [true, 'Join code used is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  score: {
    type: Number,
    default: 0
  },
  totalResponseTime: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  incorrectAnswers: {
    type: Number,
    default: 0
  },
  unattempted: {
    type: Number,
    default: 0
  },
  socketId: {
    type: String,
    default: null
  },
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  questionOrder: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }]
}, { timestamps: true });

// Virtual: get answers
teamSchema.virtual('answers', {
  ref: 'Answer',
  localField: '_id',
  foreignField: 'teamId'
});

teamSchema.set('toJSON', { virtuals: true });
teamSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Team', teamSchema);
