import { Router } from "express";
import { checkAvailability, createAppointment } from "../controllers/appointment.controllers.js";
import { verfyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Route to check availability
router.route("/check-availability").get(verfyJWT, checkAvailability);

// Route to create an appointment
router.route("/").post(verfyJWT, createAppointment);

export default router;