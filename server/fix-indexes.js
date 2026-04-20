/**
 * Fix ALL stale MongoDB indexes across all collections
 * Run: node fix-indexes.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Collections to check
    const collections = ['quizzes', 'teams', 'questions', 'answers', 'competitions', 'rounds'];

    // Known stale index names/fields to drop
    const staleIndexKeys = ['code_1', 'teamId_1', 'code', 'teamId'];

    for (const collName of collections) {
      try {
        const collection = db.collection(collName);
        const indexes = await collection.indexes();

        console.log(`\n--- ${collName} collection ---`);
        indexes.forEach(idx => {
          console.log(`  Index: ${idx.name} => ${JSON.stringify(idx.key)} ${idx.unique ? '(UNIQUE)' : ''}`);
        });

        // Drop problematic indexes
        for (const idx of indexes) {
          if (idx.name === '_id_') continue; // Never drop _id

          const keys = Object.keys(idx.key);
          const isStale = staleIndexKeys.includes(idx.name) ||
            keys.some(k => staleIndexKeys.includes(k));

          if (isStale) {
            try {
              await collection.dropIndex(idx.name);
              console.log(`  ✅ DROPPED stale index: "${idx.name}"`);
            } catch (dropErr) {
              console.log(`  ⚠️  Could not drop "${idx.name}": ${dropErr.message}`);
            }
          }
        }
      } catch (collErr) {
        // Collection might not exist yet
        console.log(`\n--- ${collName}: collection not found (OK) ---`);
      }
    }

    console.log('\n============================================');
    console.log('🎉 All stale indexes cleaned! Restart your server.');
    console.log('============================================');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixIndexes();
