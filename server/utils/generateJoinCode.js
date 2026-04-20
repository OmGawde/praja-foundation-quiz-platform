const Quiz = require('../models/Quiz');

/**
 * Generate a unique join code in format PQ-XXXX
 * where X is alphanumeric uppercase
 */
const generateJoinCode = async () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
  let attempts = 0;

  while (attempts < 100) {
    let code = 'PQ-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Check uniqueness
    const exists = await Quiz.findOne({ joinCode: code });
    if (!exists) return code;
    attempts++;
  }

  throw new Error('Failed to generate unique join code after 100 attempts');
};

module.exports = generateJoinCode;
