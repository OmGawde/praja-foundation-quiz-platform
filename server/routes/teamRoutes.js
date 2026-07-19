const router = require('express').Router();
const Team = require('../models/Team');
const Quiz = require('../models/Quiz');
const { auth } = require('../middleware/auth');
const validateObjectId = require('../middleware/validate');

const Otp = require('../models/Otp');
const sendEmail = require('../utils/mailer');

// POST /api/teams/send-otp - Send OTP verification email to team leader (PUBLIC)
router.post('/send-otp', async (req, res) => {
  try {
    const { email, joinCode } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Validate join code / quiz
    const quiz = await Quiz.findOne({ joinCode });
    if (!quiz) return res.status(404).json({ error: 'Invalid join code' });

    // Check if team email is already registered
    const existingTeam = await Team.findOne({
      quizId: quiz._id,
      email: email.toLowerCase(),
      isActive: true
    });
    if (existingTeam) {
      return res.status(400).json({ error: 'A team with this email has already registered for this quiz' });
    }

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to Database
    await Otp.findOneAndUpdate(
      { email: email.toLowerCase() },
      { otp: otpCode, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send verification email
    await sendEmail({
      to: email,
      subject: 'Verification Code for Praja Quiz Registration',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #2563eb;">Praja Quiz Verification</h2>
          <p>You requested a verification code to register your team for <strong>${quiz.title}</strong>.</p>
          <div style="margin: 24px 0; padding: 16px; background-color: #f1f5f9; border-radius: 8px; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1e1b4b;">${otpCode}</span>
          </div>
          <p style="font-size: 14px; color: #64748b;">This verification code is valid for 5 minutes. If you did not request this, you can safely ignore this email.</p>
        </div>
      `
    });

    res.json({ message: 'Verification code sent to email' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send verification code. Please check your email and try again.' });
  }
});

// POST /api/teams/register - Register team with join code & OTP verification (PUBLIC)
router.post('/register', async (req, res) => {
  try {
    const { teamName, participant1, participant2, institute, email, phone, joinCode, otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: 'Verification code (OTP) is required' });
    }

    // Find quiz by join code
    const quiz = await Quiz.findOne({ joinCode });
    if (!quiz) {
      return res.status(404).json({ error: 'Invalid join code' });
    }

    // Verify OTP first
    const record = await Otp.findOne({ email: email.toLowerCase(), otp });
    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Check quiz status
    if (quiz.status === 'live') {
      return res.status(400).json({ error: 'Cannot join a quiz that is already live' });
    }
    if (quiz.status === 'ended') {
      return res.status(400).json({ error: 'This quiz has already ended' });
    }

    // Check if team limit reached
    const teamCount = await Team.countDocuments({ quizId: quiz._id, isActive: true });
    if (teamCount >= quiz.maxTeams) {
      return res.status(400).json({ error: 'This quiz is full. No more teams can join.' });
    }

    // Check if this join code was already used by another team with same email
    const existingTeam = await Team.findOne({
      quizId: quiz._id,
      email: email.toLowerCase(),
      isActive: true
    });
    if (existingTeam) {
      return res.status(400).json({ error: 'A team with this email has already registered for this quiz' });
    }

    // Create team
    const team = new Team({
      teamName,
      participant1,
      participant2,
      institute,
      email,
      phone,
      quizId: quiz._id,
      joinCodeUsed: joinCode
    });
    await team.save();

    // Consume the OTP
    await Otp.deleteOne({ _id: record._id });

    res.status(201).json({
      team,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        status: quiz.status,
        joinCode: quiz.joinCode
      }
    });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed. Please check your input.' });
  }
});

// GET /api/teams - List teams for a quiz
router.get('/', async (req, res) => {
  try {
    const { quizId } = req.query;
    if (!quizId) return res.status(400).json({ error: 'quizId is required' });

    const teams = await Team.find({ quizId, isActive: true })
      .sort({ score: -1, totalResponseTime: 1 });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load teams.' });
  }
});

// GET /api/teams/:id - Get single team
router.get('/:id', validateObjectId(['id']), async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('quizId', 'title joinCode status maxTeams')
      .populate({
        path: 'answers',
        populate: { path: 'questionId', select: 'questionText options correctAnswerIndex type mediaUrl' }
      });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load team.' });
  }
});

// PATCH /api/teams/:id/remove - Deactivate team
router.patch('/:id/remove', auth, validateObjectId(['id']), async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    team.isActive = false;
    await team.save();

    // Notify via socket if available
    const io = req.app.get('io');
    if (io) {
      io.to(`quiz_${team.quizId}`).emit('teamRemoved', {
        teamId: team._id,
        teamName: team.teamName
      });
    }

    res.json({ message: 'Team removed successfully', team });
  } catch (error) {
    res.status(400).json({ error: 'Failed to remove team.' });
  }
});

// POST /api/teams/join-direct - Register team directly for logged-in participants (PRIVATE)
router.post('/join-direct', auth, async (req, res) => {
  try {
    const { joinCode } = req.body;
    if (!joinCode) return res.status(400).json({ error: 'Join code is required' });

    // Find quiz by join code
    const quiz = await Quiz.findOne({ joinCode: joinCode.trim().toUpperCase() });
    if (!quiz) {
      return res.status(404).json({ error: 'Invalid join code' });
    }

    // Check quiz status
    if (quiz.status === 'live') {
      return res.status(400).json({ error: 'Cannot join a quiz that is already live' });
    }
    if (quiz.status === 'ended') {
      return res.status(400).json({ error: 'This quiz has already ended' });
    }

    // Check if team limit reached
    const teamCount = await Team.countDocuments({ quizId: quiz._id, isActive: true });
    if (teamCount >= quiz.maxTeams) {
      return res.status(400).json({ error: 'This quiz is full. No more teams can join.' });
    }

    // Check if this user (email) already registered for this quiz
    const existingTeam = await Team.findOne({
      quizId: quiz._id,
      email: req.user.email,
      isActive: true
    });
    
    if (existingTeam) {
      return res.json({
        team: existingTeam,
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          status: quiz.status,
          joinCode: quiz.joinCode
        }
      });
    }

    // Create team using the user's profile info
    const team = new Team({
      teamName: req.user.teamName || req.user.username,
      participant1: req.user.participant1 || req.user.username,
      participant2: req.user.participant2 || '',
      institute: req.user.institute || 'Default Institute',
      email: req.user.email,
      phone: req.user.phone || '',
      quizId: quiz._id,
      joinCodeUsed: joinCode.trim().toUpperCase()
    });
    await team.save();

    res.status(201).json({
      team,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        status: quiz.status,
        joinCode: quiz.joinCode
      }
    });
  } catch (error) {
    console.error('Join direct error:', error);
    res.status(400).json({ error: 'Failed to join quiz.' });
  }
});

module.exports = router;
