import express from 'express';
import { getNotifications } from '../controllers/notification.controllers.js';
const router = express.Router();

// Route to fetch notifications for a user
router.get('/:userType/:userId', getNotifications);

export default router;
