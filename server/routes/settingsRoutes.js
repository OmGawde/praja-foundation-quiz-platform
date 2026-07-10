const router = require('express').Router();
const Settings = require('../models/Settings');
const { auth, authorize } = require('../middleware/auth');

// GET /api/settings - Get platform settings
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load settings.' });
  }
});

// PUT /api/settings - Update platform settings
router.put('/', auth, authorize('admin'), async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    // SECURITY: Only allow whitelisted settings fields
    const allowedFields = ['platformName', 'heroText', 'heroTitleLine1', 'heroTitleLine2', 'heroTitleLine3', 'logoUrl', 'landingImageUrl', 'landingLiveText', 'landingLiveSubtext', 'openRegistration', 'autoApproveHosts', 'publicLeaderboards', 'defaultLanguage', 'timezone'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    }
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update settings.' });
  }
});

// DELETE /api/settings - Reset to defaults
router.delete('/', auth, authorize('admin'), async (req, res) => {
  try {
    await Settings.deleteMany({});
    const newSettings = new Settings();
    await newSettings.save();
    res.json(newSettings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset settings.' });
  }
});

module.exports = router;
