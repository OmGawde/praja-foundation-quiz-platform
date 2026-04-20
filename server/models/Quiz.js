const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  roundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Round',
    required: [true, 'Round ID is required']
  },
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true
  },
  joinCode: {
    type: String,
    unique: true,
    required: [true, 'Join code is required']
  },
  maxTeams: {
    type: Number,
    default: 50
  },
  status: {
    type: String,
    enum: ['lobby', 'live', 'ended'],
    default: 'lobby'
  },
  currentQuestionIndex: {
    type: Number,
    default: -1
  },
  questionOrder: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  questionStartTime: {
    type: Date,
    default: null
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Virtual: get teams
quizSchema.virtual('teams', {
  ref: 'Team',
  localField: '_id',
  foreignField: 'quizId'
});

// Virtual: get questions
quizSchema.virtual('questions', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'quizId'
});

quizSchema.set('toJSON', { virtuals: true });
quizSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Quiz', quizSchema);
