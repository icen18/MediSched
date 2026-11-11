const toPatient = (p) => ({
  id: p._id,
  first_name: p.firstName,
  middle_name: p.middleName,
  last_name: p.lastName,
  contact_number: p.contactNumber,
  age: p.age,
  gender: p.gender
});

const toAppointment = (a) => {
  const p = a.patient || {};
  return {
    id: a._id,
    patient_id: p._id,
    patient_name: [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' '),
    appointment_at: a.appointmentAt,
    duration_minutes: a.durationMinutes || 60,
    reason: a.reason,
    status: a.status
  };
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { toPatient, toAppointment, escapeRegex };