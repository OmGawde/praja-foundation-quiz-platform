const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  competitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    required: [true, 'Competition ID is required']
  },
  name: {
    type: String,
    required: [true, 'Round name is required'],
    trim: true
  },
  order: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// Virtual: get all quizzes for this round
roundSchema.virtual('quizzes', {
  ref: 'Quiz',
  localField: '_id',
  foreignField: 'roundId'
});

roundSchema.set('toJSON', { virtuals: true });
roundSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Round', roundSchema);
