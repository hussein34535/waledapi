import { initializeApp, getApps, FirebaseApp, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getDatabase } from "firebase/database"
import { getMessaging, getToken } from "firebase/messaging"

// Firebase app name - using a consistent name prevents duplicate app errors
const APP_NAME = "waledapi-app";

const clean = (val?: string) => (val || "").trim().replace(/[\r\n\t]+/g, "");

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: clean(process.env.NEXT_PUBLIC_API_KEY) || "AIzaSyDRNcrIOz8mUHRqQk4d_JUualOIIBc9w4E",
  authDomain: clean(process.env.NEXT_PUBLIC_AUTH_DOMAIN) || "waledpro-f.firebaseapp.com",
  databaseURL: clean(process.env.NEXT_PUBLIC_DATABASE_URL) || "https://waledpro-f-default-rtdb.firebaseio.com",
  projectId: clean(process.env.NEXT_PUBLIC_PROJECT_ID) || "waledpro-f",
  storageBucket: clean(process.env.NEXT_PUBLIC_STORAGE_BUCKET) || "waledpro-f.firebasestorage.app",
  messagingSenderId: clean(process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID) || "289358660533",
  appId: clean(process.env.NEXT_PUBLIC_APP_ID) || "1:289358660533:web:8cff3ff3a9759e6f990ffc"
}

let firebaseApp: FirebaseApp;

try {
  firebaseApp = getApp(APP_NAME);
} catch {
  try {
    firebaseApp = initializeApp(firebaseConfig, APP_NAME);
  } catch {
    throw new Error('Failed to initialize Firebase');
  }
}

// Initialize Firebase services
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const database = getDatabase(firebaseApp);

// Initialize Firebase Cloud Messaging
let messaging: any = null;
if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(firebaseApp);
  } catch (error) {
    console.error("Firebase messaging not supported:", error);
  }
}

// Function to get FCM token and subscribe to topics
export async function getFCMToken() {
  if (!messaging) {
    console.error("Firebase messaging is not initialized");
    return null;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.error('Notification permission denied');
      return null;
    }

    // Get token
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });
    
    if (token) {
      try {
        await fetch('/api/fcm/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            token,
            topic: 'all_users'
          }),
        });
      } catch {
        // FCM subscription failed silently
      }
    }
    
    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

export { firebaseApp, db, auth, database };

