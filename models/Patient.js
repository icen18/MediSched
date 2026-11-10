const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, default: '', trim: true },
    lastName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 120 },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', schema);