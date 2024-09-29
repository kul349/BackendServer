import { Doctor } from "../models/doctor.models.js";
import { Appointment } from "../models/appointment.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

// Helper function to combine date and time into a Date object
const createDateTime = (date, time) => {
  const [hours, minutes] = time.split(':').map(Number);
  const dateTime = new Date(date);
  dateTime.setHours(hours, minutes, 0, 0);
  return dateTime;
};

const addMinutes = (date, minutes) => {
  return new Date(date.getTime() + minutes * 60000);
};

// Define a function to check if a time slot is available
const isTimeSlotAvailable = async (doctorId, startDateTime, endDateTime) => {
  try {
    const appointments = await Appointment.find({
      doctorId,
      startTime: { $lt: endDateTime },
      endTime: { $gt: startDateTime }
    });

    return appointments.length === 0;
  } catch (error) {
    console.error("Error in isTimeSlotAvailable:", error);
    throw new ApiError(500, "Error checking time slot availability");
  }
};

export const getAvailableAndTakenTimeSlots = async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  if (!doctorId || !date) {
    return res.status(400).json({ message: "Doctor ID and date are required" });
  }

  try {
    // Convert date to Date object
    const queryDate = new Date(date);
    
    // Find all appointments for the doctor on the specified date
    const appointments = await Appointment.find({
      doctorId,
      startTime: { $gte: queryDate },
      endTime: { $lt: addMinutes(queryDate, 24 * 60 * 60 * 1000) } // End of the day
    });

    // Map the taken slots (already booked slots)
    const takenSlots = appointments.map(appointment => ({
      startTime: appointment.startTime.toISOString(),
      endTime: appointment.endTime.toISOString()
    }));
    console.log("Taken Time Slots:", takenSlots);
    // Generate all possible time slots for the day
    const allTimeSlots = generateAllTimeSlots(date);

    // Filter out taken slots to get available slots
    const availableSlots = allTimeSlots.filter(slot => {
      return !takenSlots.some(taken => {
        const takenStart = new Date(taken.startTime);
        const takenEnd = new Date(taken.endTime);
        return slot.startTime < takenEnd && slot.endTime > takenStart;
      });
    });

    res.status(200).json({
      availableSlots: availableSlots.map(slot => ({
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString()
      })),
      takenSlots
    });
  } catch (error) {
    console.error("Error in getAvailableAndTakenTimeSlots:", error);
    res.status(500).json({ message: "Error fetching time slots", error });
  }
};

const generateAllTimeSlots = (date) => {
  const timeSlots = [];
  const startTime = new Date(date);
  startTime.setHours(9, 0, 0, 0); // Assuming 9 AM start
  const endTime = new Date(startTime);
  endTime.setHours(17, 0, 0, 0); // Assuming 5 PM end

  while (startTime < endTime) {
    const slotEndTime = new Date(startTime);
    slotEndTime.setMinutes(slotEndTime.getMinutes() + 30); // 30-minute slots

    timeSlots.push({
      startTime: new Date(startTime),
      endTime: new Date(slotEndTime)
    });

    startTime.setMinutes(startTime.getMinutes() + 30);
  }

  return timeSlots;
};


export const createAppointment = async (req, res) => {
  console.log("Incoming Request Body:", req.body); // Log the entire request body

  const { doctorId, date, startTime } = req.body;
  const patientId = req.user._id;
  console.log(`doctorId data:`,{doctorId,date,startTime});

  if (!doctorId || !date || !startTime) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const startDateTime = createDateTime(date, startTime);
    const endDateTime = addMinutes(startDateTime, 30);

    const available = await isTimeSlotAvailable(doctorId, startDateTime, endDateTime);
    if (!available) {
      return res.status(400).json({ message: "Selected time slot is not available" });
    }

    const newAppointment = new Appointment({
      patientId,
      doctorId,
      startTime: startDateTime,
      endTime: endDateTime,
      date: new Date(date)
    });

    await newAppointment.save();
    await Doctor.findByIdAndUpdate(doctorId, { $push: { appointments: newAppointment._id } });
    console.log("Appointment Created Successfully:");
    console.log("Appointment ID:", newAppointment._id);
    console.log("Appointment Details:", newAppointment);
    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: newAppointment,
    });
  } catch (error) {
    console.error("Error in createAppointment:", error);
    res.status(500).json({ message: "Error creating appointment", error });
  }
};

export const getAppointmentsByDoctor = asyncHandler(async (req, res) => {
  const doctorId = req.params.doctorId;

  if (!doctorId) {
    return res.status(400).json({ message: 'Doctor ID is required' });
  }

  try {
    const appointments = await Appointment.find({ doctorId })
      .populate('patientId', 'fullName avatar')
      .populate('doctorId', 'fullName');

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ message: 'No appointments found for this doctor' });
    }

    res.status(200).json({
      appointments: appointments.map(appointment => ({
        patientName: appointment.patientId.fullName,
        doctorName: appointment.doctorId.fullName,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,

        patientImage: appointment.patientId?.avatar || null// Use null if avatar is not available

      }))
    });
  } catch (error) {
    console.error("Error in getAppointmentsByDoctor:", error);
    res.status(500).json({ message: "Error fetching appointments", error });
  }
});
export const getAllAppointments = asyncHandler(async (req, res) => {
  try {
    // Ensure req.user is populated (from the JWT middleware)
    const patientId = req.user._id; // Use the logged-in user's ID

    // Log patientId to ensure it's being retrieved correctly
    console.log("Patient ID:", patientId);

    // Fetch appointments for the logged-in patient
    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'fullName specialization avatar') // Populate doctor details
      .populate('patientId', 'fullName avatar'); // Optionally populate patient details if needed

    // Log appointments fetched to debug
    console.log("Fetched Appointments:", appointments);

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ message: 'No appointments found for this user' });
    }

    // Format the appointments for the response
    const formattedAppointments = appointments.map(appointment => ({
      appointmentId: appointment._id,
      doctorName: appointment.doctorId?.fullName || 'Unknown Doctor',
      doctorSpecialization: appointment.doctorId?.specialization || 'Unknown Specialization',
      doctorImage: appointment.doctorId?.avatar || null, // Use null if avatar is not available
      date: appointment.date.toISOString().split('T')[0], // Format date (YYYY-MM-DD)
      startTime: appointment.startTime.toISOString().split('T')[1].slice(0, 5), // Format start time (HH:MM)
      endTime: appointment.endTime.toISOString().split('T')[1].slice(0, 5), // Format end time (HH:MM)
      patientImage: appointment.patientId?.avatar || null, // Use null if avatar is not available

    }));

    // Send the response with formatted appointments
    res.status(200).json({
      appointments: formattedAppointments
    });
  } catch (error) {
    console.error("Error in getAllAppointments:", error);
    res.status(500).json({ message: "Error fetching appointments", error });
  }
});
