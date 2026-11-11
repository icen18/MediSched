const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    appointmentAt: { type: String, required: true, index: true },
    durationMinutes: { type: Number, enum: [50, 60, 90], default: 60 },
    reason: { type: String, required: true, trim: true, maxlength: 255 },
    status: { type: String, enum: ['Pending', 'Scheduled', 'Completed', 'Cancelled'], default: 'Pending' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', schema);