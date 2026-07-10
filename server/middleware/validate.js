const mongoose = require('mongoose');

/**
 * Middleware to validate MongoDB ObjectId path parameters
 * @param {string[]} paramNames - List of parameter names to validate (defaults to ['id'])
 */
const validateObjectId = (paramNames = ['id']) => {
  return (req, res, next) => {
    for (const name of paramNames) {
      const val = req.params[name];
      if (val && !mongoose.Types.ObjectId.isValid(val)) {
        return res.status(400).json({ error: 'Invalid ID format.' });
      }
    }
    next();
  };
};

module.exports = validateObjectId;
