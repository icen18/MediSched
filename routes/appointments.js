const express = require('express');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const { auth, requireRole } = require('../middleware/auth');
const { validDateTime } = require('../utils/validate');
const { toAppointment } = require('../utils/serialize');

const router = express.Router();
router.use(auth, requireRole('admin'));

const STATUSES = ['Pending', 'Scheduled', 'Completed', 'Cancelled'];

router.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : res.status(404).json({ error: 'Appointment not found.' }));

// one doctor → one active appointment per time slot
const hasConflict = async (at, excludeId) =>
  !!(await Appointment.exists({
    appointmentAt: at,
    status: { $in: ['Pending', 'Scheduled'] },
    ...(excludeId ? { _id: { $ne: excludeId } } : {})
  }));

router.get('/', async (req, res) => {
  const filter = STATUSES.includes(req.query.status) ? { status: req.query.status } : {};
  let list = (await Appointment.find(filter).sort({ appointmentAt: 1 }).populate('patient').lean()).map(toAppointment);

  const q = String(req.query.q ?? '').trim().toLowerCase();
  if (q) {
    list = list.filter((a) =>
      [a.patient_name, a.reason, a.status, a.appointment_at.replace('T', ' ')].some((v) => v.toLowerCase().includes(q)));
  }
  res.json(list);
});

router.post('/', async (req, res) => {
  const patientId = String(req.body?.patient_id ?? '');
  const at = String(req.body?.appointment_at ?? '');
  const reason = String(req.body?.reason ?? '').trim();

  if (!mongoose.isValidObjectId(patientId) || !(await Patient.exists({ _id: patientId })))
    return res.status(400).json({ error: 'Please select a patient.' });
  if (!validDateTime(at)) return res.status(400).json({ error: 'Please choose a valid date and time.' });
  if (!reason || reason.length > 255) return res.status(400).json({ error: 'Please enter a reason (max 255 characters).' });
  if (await hasConflict(at)) return res.status(409).json({ error: 'That time slot is already booked.' });

  const a = await Appointment.create({ patient: patientId, appointmentAt: at, reason, status: 'Scheduled' });
  res.status(201).json({ id: a._id });
});

router.patch('/:id/status', async (req, res) => {
  const status = req.body?.status;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

  const a = await Appointment.findById(req.params.id);
  if (!a) return res.status(404).json({ error: 'Appointment not found.' });
  if (['Pending', 'Scheduled'].includes(status) && (await hasConflict(a.appointmentAt, a._id)))
    return res.status(409).json({ error: 'Another appointment already holds that time slot.' });

  a.status = status;
  await a.save();
  res.json({ ok: true });
});

module.exports = router;