/**
 * Seed default admin user
 * Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=YourPass123 node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI is not defined in environment variables');
      process.exit(1);
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@praja.com';
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('❌ ADMIN_PASSWORD is required. Usage:');
      console.error('   ADMIN_PASSWORD=YourSecurePass123 node seed.js');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists!');
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      username: 'admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    });

    await admin.save();
    console.log('🚀 Admin user created successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding admin user:', err.message);
    process.exit(1);
  }
};

seedAdmin();
