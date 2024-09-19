import { Router } from "express";
import { getAvailableAndTakenTimeSlots, createAppointment,getAppointmentsByDoctor } from "../controllers/appointment.controllers.js";
import { verfyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Route to check availability
 
// Route to create an appointment
router.route("/getAppointment").post(verfyJWT, createAppointment);
router.route("/getAllAppointment/:doctorId").get(getAppointmentsByDoctor);
router.route("/getAvailableTimeSlots/:doctorId").get(getAvailableAndTakenTimeSlots);



export default router;