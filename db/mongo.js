const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function connect() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  await seedAdmin();
}

// creates the admin account only if there is none yet
async function seedAdmin() {
  if (await User.exists({ role: 'admin' })) return;

  const username = (process.env.ADMIN_USERNAME || 'admin').trim();
  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV === 'production') throw new Error('ADMIN_PASSWORD must be set in production');
    password = 'admin123';
  }

  await User.create({
    username,
    passwordHash: bcrypt.hashSync(password, 10),
    fullName: process.env.ADMIN_NAME || 'Tolenada, JZ',
    role: 'admin'
  });
  console.log(`Admin account created (username: ${username.toLowerCase()})`);
}

module.exports = { connect };