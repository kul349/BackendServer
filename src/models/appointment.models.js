// Appointment model example
import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String, // Could also be Date if you prefer handling times as Date objects
    required: true
  },
  endTime: {
    type: String, // Could also be Date if you prefer handling times as Date objects
    required: true
  },
  type: {
    type: String,
    enum: ['in-person', 'virtual'],
    required: true
  },
  reasonForVisit: {
    type: String
  }
}, { timestamps: true });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
