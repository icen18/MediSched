const express = require('express');
const Appointment = require('../models/Appointment');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, requireRole('admin'), async (req, res) => {
  // the browser sends its own local date, so "today" is right even on a UTC server
  const d = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '') ? req.query.date : new Date().toISOString().slice(0, 10);

  const [today, pending, scheduled, cancelled] = await Promise.all([
    Appointment.countDocuments({ appointmentAt: { $gte: `${d}T00:00`, $lte: `${d}T23:59` }, status: { $ne: 'Cancelled' } }),
    Appointment.countDocuments({ status: 'Pending' }),
    Appointment.countDocuments({ status: 'Scheduled' }),
    Appointment.countDocuments({ status: 'Cancelled' })
  ]);

  res.json({ today, pending, scheduled, cancelled });
});

module.exports = router;