const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  session: {
    type: String,
    enum: ['morning', 'lunch', 'afternoon', 'evening'],
    required: true
  },
  clockIn: {
    type: Date,
    default: null
  },
  clockOut: {
    type: Date,
    default: null
  },
  latitude: Number,
  longitude: Number,
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);