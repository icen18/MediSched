const Appointment = require('../models/Appointment');

const SLOT_MINUTES = 60; // every appointment blocks this much time (change to 30, 45, 90...)

// 'YYYY-MM-DDTHH:mm' -> minutes (no time zone involved)
const toMin = (at) => {
  const [d, t] = at.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [h, mi] = t.split(':').map(Number);
  return Date.UTC(y, m - 1, day, h, mi) / 60000;
};

const shiftDay = (date, n) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * 86400000).toISOString().slice(0, 10);
};

const clock = (min) => new Date(min * 60000).toLocaleTimeString('en-US',
  { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
const day = (min) => new Date(min * 60000).toLocaleDateString('en-US',
  { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

// Returns a readable description of the clashing appointment, or null if the time is free.
async function findConflict(at, excludeId) {
  const date = at.slice(0, 10);
  const filter = {
    status: { $in: ['Pending', 'Scheduled'] },
    appointmentAt: { $gte: `${shiftDay(date, -1)}T00:00`, $lte: `${shiftDay(date, 1)}T23:59` }
  };
  if (excludeId) filter._id = { $ne: excludeId };

  const start = toMin(at);
  const end = start + SLOT_MINUTES;

  for (const a of await Appointment.find(filter).lean()) {
    const s = toMin(a.appointmentAt);
    const e = s + SLOT_MINUTES;
    if (start < e && end > s) return `${day(s)}, ${clock(s)} – ${clock(e)}`;
  }
  return null;
}

module.exports = { SLOT_MINUTES, findConflict };