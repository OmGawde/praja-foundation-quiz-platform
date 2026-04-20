const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  platformName: {
    type: String,
    default: 'PRAJA QUIZ'
  },
  heroText: {
    type: String,
    default: 'National Excellence in Education. Join the premier platform for national-level competitions.'
  },
  logoUrl: {
    type: String,
    default: ''
  },
  openRegistration: {
    type: Boolean,
    default: true
  },
  autoApproveHosts: {
    type: Boolean,
    default: false
  },
  publicLeaderboards: {
    type: Boolean,
    default: true
  },
  defaultLanguage: {
    type: String,
    default: 'en'
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
