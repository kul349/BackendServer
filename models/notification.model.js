import mongoose from "mongoose";
const notificationSchema = new mongoose.Schema({
  userType: {
    type: String,
    enum: ['Doctor', 'Patient'], // Defines if the notification is for a doctor or patient
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType', // Dynamically references either Doctor or Patient based on userType
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Notification = mongoose.model('Notification', notificationSchema);

