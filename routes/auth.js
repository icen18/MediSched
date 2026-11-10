const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const username = String(req.body?.username ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });

  const user = await User.findOne({ username });
  if (!user || !bcrypt.compareSync(password, user.passwordHash))
    return res.status(401).json({ error: 'Invalid username or password.' });

  const publicUser = { id: String(user._id), username: user.username, role: user.role, full_name: user.fullName };
  res.json({ token: signToken(publicUser), user: publicUser });
});

module.exports = router;