require('dotenv').config();
const dns = require('dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Render load balancer) for rate limiting
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
  }
});

// ═══════════════════════════════════════════
// SECURITY MIDDLEWARE
// ═══════════════════════════════════════════

// Helmet: sets secure HTTP headers (XSS protection, clickjacking, MIME sniffing, etc.)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow uploaded media to load
  contentSecurityPolicy: false // Disable CSP for dev (enable in production with proper directives)
}));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsers — SECURITY: reduced from 50MB to 2MB to prevent memory DoS
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// NoSQL Injection Protection: strips $ and . from req.body, req.query, req.params
app.use(mongoSanitize());

// Global rate limiter: 200 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// Strict auth rate limiter: 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/competitions', require('./routes/competitionRoutes'));
app.use('/api/rounds', require('./routes/roundRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/csv', require('./routes/csvRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

// Socket.io handler
const quizSocket = require('./sockets/quizSocket');
quizSocket(io);

// Make io accessible to routes
app.set('io', io);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    // Prevent API routes from falling back to index.html
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
}

// Error handling middleware — SECURITY: don't leak stack traces
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Praja Quiz Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

// === Auto-cleanup: delete archived competitions older than 1 year ===
const Competition = require('./models/Competition');
const Round = require('./models/Round');
const Quiz = require('./models/Quiz');
const Question = require('./models/Question');
const Answer = require('./models/Answer');
const Team = require('./models/Team');

async function cleanupOldArchives() {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Backfill: set completedAt from endDate for archived competitions missing it
    await Competition.updateMany(
      { isArchived: true, completedAt: null },
      [{ $set: { completedAt: '$endDate' } }]
    );

    // Find archived competitions older than 1 year
    const expired = await Competition.find({
      isArchived: true,
      completedAt: { $lte: oneYearAgo }
    });

    if (expired.length === 0) return;

    console.log(`🗑️  Auto-cleanup: removing ${expired.length} archived competition(s) older than 1 year...`);

    for (const comp of expired) {
      const rounds = await Round.find({ competitionId: comp._id }).select('_id');
      const roundIds = rounds.map(r => r._id);
      const quizzes = await Quiz.find({ roundId: { $in: roundIds } }).select('_id');
      const quizIds = quizzes.map(q => q._id);

      await Answer.deleteMany({ quizId: { $in: quizIds } });
      await Team.deleteMany({ quizId: { $in: quizIds } });
      await Question.deleteMany({ quizId: { $in: quizIds } });
      await Quiz.deleteMany({ roundId: { $in: roundIds } });
      await Round.deleteMany({ competitionId: comp._id });
      await Competition.findByIdAndDelete(comp._id);

      console.log(`   ✓ Deleted: "${comp.name}" (archived ${comp.completedAt?.toLocaleDateString()})`);
    }
  } catch (err) {
    console.error('Auto-cleanup error:', err.message);
  }
}

// Run cleanup on startup (after a short delay for DB connection) and then every 24 hours
setTimeout(cleanupOldArchives, 5000);
setInterval(cleanupOldArchives, 24 * 60 * 60 * 1000);
