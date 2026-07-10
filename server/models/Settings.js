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
  heroTitleLine1: {
    type: String,
    default: 'Compete.'
  },
  heroTitleLine2: {
    type: String,
    default: 'Learn.'
  },
  heroTitleLine3: {
    type: String,
    default: 'Lead.'
  },
  logoUrl: {
    type: String,
    default: ''
  },
  landingImageUrl: {
    type: String,
    default: ''
  },
  landingLiveText: {
    type: String,
    default: 'Live National Finals'
  },
  landingLiveSubtext: {
    type: String,
    default: 'Join competitions happening right now'
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
