import admin  from 'firebse-admin';
var serviceAccount = require("path/to/serviceAccountKey.json");
const googleCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
console.log(googleCredentials); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const sendNotification = async (tokens, title, body) => {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      tokens: tokens, // An array of tokens for both doctor and patient
    };
  
    try {
      const response = await admin.messaging().sendMulticast(message);
      console.log('Notification sent successfully:', response);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  export {sendNotification};