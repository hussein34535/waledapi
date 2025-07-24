// هذا الملف يستخدم فقط على الخادم
// تحذير: لا تستورد هذا الملف من أي مكونات العميل
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging, Messaging } from "firebase-admin/messaging";
import { getDatabase } from "firebase-admin/database";
import path from 'path';

// Initialize Firebase Admin SDK if not already initialized
let firebaseAdminApp;

try {
  if (!getApps().length) {
    // Prefer environment variables for initialization
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      console.log('Firebase Admin: Initializing with environment variables.');
      firebaseAdminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL,
      });
    } else {
      // Fallback to service account file if env vars are not set
      console.log('Firebase Admin: Environment variables not found, trying service account file.');
      try {
        const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
        const fs = require('fs');
        if (fs.existsSync(serviceAccountPath)) {
          let fileContents = fs.readFileSync(serviceAccountPath, 'utf8');
          if (fileContents.charCodeAt(0) === 0xFEFF) {
            fileContents = fileContents.slice(1);
          }
          const serviceAccount = JSON.parse(fileContents);
          firebaseAdminApp = initializeApp({
            credential: cert(serviceAccount),
            databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL,
          });
          console.log('Firebase Admin: Initialized with service account file.');
        } else {
          // Fallback to application default credentials
          console.log('Firebase Admin: Service account file not found, using application default credentials.');
          firebaseAdminApp = initializeApp({
            databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL,
          });
        }
      } catch (error) {
        console.error('Firebase Admin: Failed to initialize with service account file, using default credentials.', error);
        firebaseAdminApp = initializeApp({
          databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL,
        });
      }
    }
  } else {
    firebaseAdminApp = getApps()[0];
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
}

let adminDb, adminDatabase;
let adminMessaging: Messaging | undefined;

if (firebaseAdminApp) {
  adminDb = getFirestore(firebaseAdminApp);
  adminDatabase = getDatabase(firebaseAdminApp);
  try {
    adminMessaging = getMessaging(firebaseAdminApp);
  } catch (error) {
    console.error('Failed to initialize Firebase Messaging:', error);
  }
}

// Default topic that all Android app users will be subscribed to
export const DEFAULT_ANDROID_TOPIC = "android_users";

// Function to send message to all Android app users
export async function sendMessageToAndroidApp(title: string, body: string, data?: Record<string, string>) {
  if (!adminMessaging) {
    throw new Error('Firebase Messaging is not initialized');
  }
  
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      // Use the default Android topic
      topic: DEFAULT_ANDROID_TOPIC,
      android: {
        priority: "high" as const,
        notification: {
          // Android specific notification settings
          sound: "default",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
          channelId: "high_importance_channel"
        }
      }
    };

    const response = await adminMessaging.send(message);
    console.log('Successfully sent message to all Android users:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending message to Android users:', error);
    throw error;
  }
}

// Function to send message to a topic
export async function sendMessageToTopic(topic: string, title: string, body: string, data?: Record<string, string>) {
  if (!adminMessaging) {
    throw new Error('Firebase Messaging is not initialized');
  }
  
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      topic: topic,
    };

    const response = await adminMessaging.send(message);
    console.log('Successfully sent message to topic:', topic, response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending message to topic:', error);
    throw error;
  }
}

// Function to subscribe tokens to a topic
export async function subscribeToTopic(tokens: string[], topic: string) {
  if (!adminMessaging) {
    throw new Error('Firebase Messaging is not initialized');
  }
  
  try {
    const response = await adminMessaging.subscribeToTopic(tokens, topic);
    console.log('Successfully subscribed to topic:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    throw error;
  }
}

export { adminDb, adminMessaging, adminDatabase };