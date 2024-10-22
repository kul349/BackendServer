import admin from 'firebase-admin';
import { config } from 'dotenv';
import fs from 'fs'; // Importing file system module to read the credentials file
import { Notification } from './models/notification.model.js'; // Importing the Notification model

// Load environment variables from .env file if present
config();

// Verify that GOOGLE_APPLICATION_CREDENTIALS is set
const googleCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!googleCredentialsPath) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS is not set.');
  process.exit(1); // Exit the process if credentials are not set
}

console.log('Google credentials path:', googleCredentialsPath);

// Initialize Firebase Admin SDK
try {
  // Read the credentials file
  const serviceAccount = JSON.parse(fs.readFileSync(googleCredentialsPath, 'utf-8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount), // Use service account credentials
  });
  
  console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1); // Exit the process on initialization failure
}

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
    // Ensure userId and userType are strings in the data payload
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

export { sendNotification };
