const express = require('express');
const Appointment = require('../models/Appointment');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, requireRole('admin'), async (req, res) => {
  const [completed, pending, scheduled, cancelled] = await Promise.all([
    Appointment.countDocuments({ status: 'Completed' }),
    Appointment.countDocuments({ status: 'Pending' }),
    Appointment.countDocuments({ status: 'Scheduled' }),
    Appointment.countDocuments({ status: 'Cancelled' })
  ]);

  res.json({ completed, pending, scheduled, cancelled });
});

module.exports = router;