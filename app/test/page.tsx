"use client"

import FirebaseTest from "@/components/firebase-test"
import FirebaseDirectTest from "@/components/firebase-direct-test"

export default function TestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Firebase Connection Tests</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <FirebaseDirectTest />
        <FirebaseTest />
      </div>

      <div className="mt-8 p-4 bg-muted/20 rounded-md">
        <h2 className="text-xl font-bold mb-2">Troubleshooting Steps</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Check if the Realtime Database test succeeds but Firestore fails (indicates Firestore setup issue)</li>
          <li>Verify in Firebase Console that Firestore database has been created</li>
          <li>Check Firebase Console for any error messages or quota limits</li>
          <li>Ensure your Firebase project billing status is active</li>
          <li>Try creating the Firestore database manually in the Firebase Console</li>
        </ol>
      </div>
    </div>
  )
}

