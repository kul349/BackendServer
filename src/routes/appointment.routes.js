import { Router } from "express";
import { isTimeSlotAvailable, createAppointment } from "../controllers/appointment.controllers.js";
import { verfyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Route to check availability
router.route("/check-availability").get(verfyJWT, isTimeSlotAvailable);
 
// Route to create an appointment
router.route("/getAppointment").post(verfyJWT, createAppointment);

export default router;