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

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@praja.com' });
    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists!');
      process.exit(0);
    }

    // Create default admin user
    const admin = new User({
      username: 'admin',
      email: 'admin@praja.com',
      password: 'AdminPassword123', // Meets strength requirements (letters + numbers, >8 chars)
      role: 'admin'
    });

    await admin.save();
    console.log('🚀 Default admin user created successfully!');
    console.log('📧 Email: admin@praja.com');
    console.log('🔑 Password: AdminPassword123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding admin user:', err);
    process.exit(1);
  }
};

seedAdmin();
