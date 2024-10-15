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
// Function to delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId, userId } = req.params; // Get notificationId and userId from request parameters

    // Find and delete the notification based on notificationId and userId
    const deletedNotification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: userId, // Match only by notificationId and userId
    });

    if (!deletedNotification) {
      return res.status(404).json({
        message: "Notification not found or does not belong to this user",
      });
    }

    return res.status(200).json({
      message: "Notification deleted successfully",
      notification: deletedNotification,
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({
      message: "An error occurred while deleting the notification",
      error: error.message,
    });
  }
};
