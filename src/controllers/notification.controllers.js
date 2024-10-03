import { Notification } from '../models/notification.model.js';

export const getNotifications = async (req, res) => {
  try {
    const { userType, userId } = req.params;
    const notifications = await Notification.find({ userType, userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};
