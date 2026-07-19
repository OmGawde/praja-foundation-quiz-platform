const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: function (v) {
        // Must contain at least one letter and one number
        return /[a-zA-Z]/.test(v) && /[0-9]/.test(v);
      },
      message: 'Password must contain at least one letter and one number'
    }
  },
  role: {
    type: String,
    enum: ['admin', 'quiz_manager', 'participant'],
    default: 'quiz_manager'
  },
  // Persistent profile fields for participants
  teamName: {
    type: String,
    trim: true
  },
  participant1: {
    type: String,
    trim: true
  },
  participant2: {
    type: String,
    trim: true,
    default: ''
  },
  institute: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
