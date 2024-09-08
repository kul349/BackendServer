// controllers/appointment.controller.js
import { ApiError } from "../utils/apiError.js";
import { Doctor } from "../models/doctor.models.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Appointment } from "../models/appointment.models.js";
import mongoose from "mongoose";

export const createAppointment = asyncHandler(async (req, res) => {

  const { doctorId, date, startTime, endTime, type, reasonForVisit } = req.body;
  const patientId = req.user._id; // Assuming this is set correctly by your auth middleware
 
 
  if (!doctorId || !date || !startTime || !endTime || !type) {
    throw new ApiError(400, "All fields are required");
  }

;

  // Check if the doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  // Check if the patient exists
  const patient = await User.findById(patientId);
  if (!patient) {
    throw new ApiError(404, "Patient not found");
  }

  // Check if the time slot is available
  const available = await isTimeSlotAvailable(
    doctorId,
    new Date(date),
    startTime,
    endTime
  );
  if (!available) {
    throw new ApiError(400, "The selected time slot is not available");
  }

  // Create the appointment
  const newAppointment = new Appointment({
    patientId,
    doctorId,
    date,
    startTime,
    endTime,
    type,
    reasonForVisit,
  });

  await newAppointment.save();

  res.status(201).json({
    message: "Appointment booked successfully",
    appointment: newAppointment,
  });
});

// Utility function to check time slot availability
export const isTimeSlotAvailable = async (
  doctorId,
  date,
  startTime,
  endTime
) => {
  const appointments = await Appointment.find({
    doctorId,
    date,
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  });

  return appointments.length === 0;
};
