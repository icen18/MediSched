const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    // stored as typed, 'YYYY-MM-DDTHH:mm', so there are no time-zone shifts
    appointmentAt: { type: String, required: true, index: true },
    reason: { type: String, required: true, trim: true, maxlength: 255 },
    status: { type: String, enum: ['Pending', 'Scheduled', 'Completed', 'Cancelled'], default: 'Pending' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', schema);