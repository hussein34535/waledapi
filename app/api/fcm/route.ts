import { initializeApp, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { credential } from 'firebase-admin'; // Import credential from 'firebase-admin'

if (!getApps().length) {
  // Use applicationDefault() which reads FIREBASE_* env vars on Vercel
  initializeApp({
    credential: credential.applicationDefault(),
  });
}

export async function POST(request: Request) {
  try {
    const { title, body } = await request.json();
    const topic = 'all'; // Send to the 'all' topic

    const message = {
      notification: {
        title,
        body,
      },
      topic: topic, // Use topic instead of token
    };

    const response = await getMessaging().send(message);

    console.log('Successfully sent message to topic:', topic, response);

    return new Response(JSON.stringify({ messageId: response }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return new Response(JSON.stringify({ error: 'Failed to send message' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}