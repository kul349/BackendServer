import express from 'express';
import { getNotifications, deleteNotification} from '../controllers/notification.controllers.js';
import { verfyJWT } from '../middlewares/auth.middlewares.js';
const router = express.Router();

// Route to fetch notifications for a user
router.get('/:userType/:userId', getNotifications);
router.delete('/:notificationId/:userId', verfyJWT,deleteNotification); // Define route for deleting notifications

export default router;
