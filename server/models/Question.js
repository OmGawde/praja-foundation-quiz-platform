const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: [true, 'Quiz ID is required']
  },
  type: {
    type: String,
    enum: ['text', 'image', 'audio', 'video'],
    default: 'text'
  },
  questionText: {
    type: String,
    required: [true, 'Question text is required']
  },
  mediaUrl: {
    type: String,
    default: ''
  },
  options: {
    type: [String],
    validate: {
      validator: function (v) {
        return v.length >= 2 && v.length <= 6;
      },
      message: 'A question must have between 2 and 6 options'
    },
    required: [true, 'Options are required']
  },
  correctAnswerIndex: {
    type: Number,
    required: [true, 'Correct answer index is required'],
    min: 0
  },
  timeLimit: {
    type: Number,
    default: 30,
    min: 5,
    max: 300
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
