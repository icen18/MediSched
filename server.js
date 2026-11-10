const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); 

require('dotenv').config();
require('express-async-errors'); 
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const { connect } = require('./db/mongo');

const app = express();
app.use(express.json());

app.get('/healthz', (req, res) => res.json({ ok: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/appointments', require('./routes/appointments'));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  if (err instanceof mongoose.Error.ValidationError) return res.status(400).json({ error: 'Invalid data.' });
  if (err.code === 11000) return res.status(409).json({ error: 'That record already exists.' });
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connect();
    console.log('MongoDB connected');
  } catch (e) {
    console.error('\nCould not start:', e.message);
    console.error('Check MONGO_URI (password, database name), and that Atlas Network Access allows 0.0.0.0/0.\n');
    process.exit(1);
  }
  app.listen(PORT, () => console.log(`MediSched running at http://localhost:${PORT}`));
})();