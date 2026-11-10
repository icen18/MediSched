const express = require('express');
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { auth, requireRole } = require('../middleware/auth');
const { cleanPatient } = require('../utils/validate');
const { toPatient, escapeRegex } = require('../utils/serialize');

const router = express.Router();
router.use(auth, requireRole('admin'));

router.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : res.status(404).json({ error: 'Patient not found.' }));

const fields = (d) => ({
  firstName: d.first_name,
  middleName: d.middle_name,
  lastName: d.last_name,
  contactNumber: d.contact_number,
  age: d.age,
  gender: d.gender
});

router.get('/', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const filter = {};
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    const opt = { regex: escapeRegex(q), options: 'i' };
    filter.$or = [
      { firstName: rx }, { middleName: rx }, { lastName: rx }, { contactNumber: rx },
      { $expr: { $regexMatch: { input: { $concat: ['$firstName', ' ', '$lastName'] }, ...opt } } },
      { $expr: { $regexMatch: { input: { $concat: ['$firstName', ' ', '$middleName', ' ', '$lastName'] }, ...opt } } }
    ];
  }
  const rows = await Patient.find(filter).sort({ createdAt: 1 }).lean();
  res.json(rows.map(toPatient));
});

router.post('/', async (req, res) => {
  const { error, data } = cleanPatient(req.body);
  if (error) return res.status(400).json({ error });
  const p = await Patient.create(fields(data));
  res.status(201).json(toPatient(p));
});

router.put('/:id', async (req, res) => {
  const { error, data } = cleanPatient(req.body);
  if (error) return res.status(400).json({ error });
  const p = await Patient.findByIdAndUpdate(req.params.id, fields(data), { new: true, runValidators: true });
  if (!p) return res.status(404).json({ error: 'Patient not found.' });
  res.json(toPatient(p));
});

router.delete('/:id', async (req, res) => {
  const p = await Patient.findByIdAndDelete(req.params.id);
  if (!p) return res.status(404).json({ error: 'Patient not found.' });
  await Appointment.deleteMany({ patient: p._id }); // remove their appointments too
  res.json({ ok: true });
});

module.exports = router;