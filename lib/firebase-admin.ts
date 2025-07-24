// هذا الملف يستخدم فقط على الخادم
// تحذير: لا تستورد هذا الملف من أي مكونات العميل
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging, Messaging } from "firebase-admin/messaging";
import { getDatabase, Database } from "firebase-admin/database";
import path from 'path';

let firebaseAdminApp;

try {
  if (!getApps().length) {
    // Prefer service account key from environment variable (Base64 encoded)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log('Firebase Admin: Initializing with service account key from environment variable.');
      const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8'));
      firebaseAdminApp = initializeApp({
        credential: cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL,
      });
    }
    // Fallback to individual environment variables
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      console.log('Firebase Admin: Initializing with individual environment variables.');
      firebaseAdminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL,
      });
    } else {
      // Fallback to default credentials if nothing else is available
      console.log('Firebase Admin: No specific credentials found, using application default credentials.');
      firebaseAdminApp = initializeApp({
        databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL,
      });
    }
  } else {
    firebaseAdminApp = getApps()[0];
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
}

let adminDb, adminDatabase: Database | undefined;
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