const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin'], default: 'admin' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', schema);