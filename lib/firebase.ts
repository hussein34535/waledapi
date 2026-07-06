import { initializeApp, getApps, FirebaseApp, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getDatabase } from "firebase/database"
import { getMessaging, getToken } from "firebase/messaging"

// Firebase app name - using a consistent name prevents duplicate app errors
const APP_NAME = "waledapi-app";

// Add a timestamp parameter to avoid URL caching
const addTimestampToURL = (url: string | undefined): string | undefined => {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_ts=${Date.now()}`;
};

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID
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

// Database configuration for real-time data
const dbConfig = {
  // These settings help ensure we always get fresh data
  synchronizeTabs: false, // Don't sync data across tabs
};

if (typeof window !== 'undefined') {
  try {
    database.app.options.databaseURL = addTimestampToURL(database.app.options.databaseURL);
    if ((database as any).settings) {
      (database as any).settings(dbConfig);
    }
  } catch {
    // Non-critical configuration
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

