// Appointment model example
import mongoose,{Schema} from "mongoose";

const appointmentSchema = new Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: Date, // Could also be Date if you prefer handling times as Date objects
    required: true
  },
  endTime: {
    type: Date, // Could also be Date if you prefer handling times as Date objects
    required: true
  },
  
}, { timestamps: true });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
