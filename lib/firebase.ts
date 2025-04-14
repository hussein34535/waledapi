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

// Log firebase config (except for sensitive info)
console.log("Firebase Config (Vercel):", { 
  hasApiKey: !!process.env.NEXT_PUBLIC_API_KEY,
  databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  environment: process.env.NODE_ENV,
  appName: APP_NAME
});

// Initialize Firebase - safely handle potential duplicate initializations
let firebaseApp: FirebaseApp;

try {
  // Check if app with this name already exists and get it
  firebaseApp = getApp(APP_NAME);
  console.log(`Using existing Firebase app with name: ${APP_NAME}`);
} catch (error) {
  // App doesn't exist yet, create a new one with our specific name
  try {
    firebaseApp = initializeApp(firebaseConfig, APP_NAME);
    console.log(`Firebase initialized successfully with name: ${APP_NAME} in ${process.env.NODE_ENV} environment!`);
  } catch (error: any) {
    console.error("Firebase initialization error:", error);
    throw new Error('Failed to initialize Firebase: ' + error.message);
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

// Configure database for non-caching on client-side only
if (typeof window !== 'undefined') {
  try {
    // Add timestamp to database URL to prevent caching
    database.app.options.databaseURL = addTimestampToURL(database.app.options.databaseURL);
    
    // Apply additional settings if supported
    if ((database as any).settings) {
      (database as any).settings(dbConfig);
    }
  } catch (error) {
    console.warn("Could not configure database for real-time data:", error);
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
    
    console.log("FCM Token:", token);
    
    // Subscribe the token to the all_users topic
    if (token) {
      try {
        // Send token to backend to subscribe to "all_users" topic
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
        console.log("Subscribed to all_users topic");
      } catch (error) {
        console.error("Error subscribing to topic:", error);
      }
    }
    
    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

export { firebaseApp, db, auth, database };

