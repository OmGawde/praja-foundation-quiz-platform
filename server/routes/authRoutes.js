const router = require('express').Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const sendEmail = require('../utils/mailer');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    // SECURITY: Never allow role from request body — always default to quiz_manager
    // Only an existing admin should be able to promote users (via a separate admin route)

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email or username.' });
    }

    const user = new User({ username, email, password, role: 'quiz_manager' });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (error) {
    // SECURITY: Don't leak internal error details
    console.error('Register error:', error.message);
    res.status(400).json({ error: 'Registration failed. Please check your input.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ user, token });
  } catch (error) {
    // SECURITY: Don't leak internal error details
    console.error('Login error:', error.message);
    res.status(400).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch user.' });
  }
});

// POST /api/auth/register-participant
router.post('/register-participant', async (req, res) => {
  try {
    const { username, email, password, teamName, participant1, participant2, institute, phone } = req.body;

    if (!username || !email || !password || !teamName || !participant1 || !institute) {
      return res.status(400).json({ error: 'Username, email, password, team name, participant 1, and institute are required.' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email or username.' });
    }

    const user = new User({
      username,
      email,
      password,
      role: 'participant',
      teamName,
      participant1,
      participant2: participant2 || '',
      institute,
      phone: phone || ''
    });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Participant Register error:', error.message);
    res.status(400).json({ error: 'Registration failed. Please check your input.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Security measure: Do not confirm whether user exists
      return res.json({ message: 'If this email is registered, a password reset link has been sent.' });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - Praja Quiz',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #2563eb;">Praja Quiz Password Reset</h2>
          <p>You requested a password reset for your account on Praja Quiz Platform.</p>
          <p>Please click the button below to reset your password. This link is valid for 1 hour.</p>
          <div style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 12px; color: #64748b;">Or copy and paste this link in your browser:</p>
          <p style="font-size: 12px; color: #64748b; word-break: break-all;">${resetUrl}</p>
          <p style="font-size: 14px; color: #64748b;">If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      `
    });

    res.json({ message: 'If this email is registered, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, token, and new password are required.' });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset link.' });
    }

    // Save password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ error: 'Failed to reset password. Please check your password strength.' });
  }
});

module.exports = router;
