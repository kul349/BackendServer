import admin from 'firebase-admin';
import { config } from 'dotenv';
import { Notification } from './models/notification.model.js'; // Importing the Notification model// Load environment variables from .env file if present
config();

// Verify that GOOGLE_APPLICATION_CREDENTIALS is set
const googleCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!googleCredentials) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS is not set.');
  process.exit(1); // Exit the process if credentials are not set
}

console.log('Google credentials path:', googleCredentials);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(), // Use the application default credentials
});

const sendNotification = async (tokens, title, body, userType, userId) => {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    console.error('Invalid tokens array:', tokens);
    return;
  }

  const message = {
    notification: {
      title: title,
      body: body,
    },
    // Make sure userId and userType are strings in the data payload
    data: {
      userType: String(userType),
      userId: String(userId),  // Convert userId to a string
    }
  };

  const responses = [];
  try {
    // Send each message individually
    for (const token of tokens) {
      const response = await admin.messaging().send({ ...message, token });
      responses.push(response);
    }
    console.log('Notifications sent successfully:', responses);

    // Save the notification to MongoDB
    const notification = new Notification({
      userType: userType,
      userId: userId,
      title: title,
      message: body,
    });

    await notification.save();
    console.log('Notification saved to MongoDB:', notification);
  } catch (error) {
    console.error('Error sending notification or saving to MongoDB:', error);
  }
};
;



export { sendNotification };