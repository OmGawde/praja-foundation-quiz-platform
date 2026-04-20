const router = require('express').Router();
const Settings = require('../models/Settings');
const { auth } = require('../middleware/auth');

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
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/settings - Update platform settings
router.put('/', auth, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/settings - Reset to defaults
router.delete('/', auth, async (req, res) => {
  try {
    await Settings.deleteMany({});
    const newSettings = new Settings();
    await newSettings.save();
    res.json(newSettings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
