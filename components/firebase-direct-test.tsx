"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { initializeApp } from "firebase/app"
import { getDatabase, ref, set, push } from "firebase/database"

// Direct Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDRNcrIOz8mUHRqQk4d_JUualOIIBc9w4E",
  authDomain: "waledpro-f.firebaseapp.com",
  databaseURL: "https://waledpro-f-default-rtdb.firebaseio.com",
  projectId: "waledpro-f",
  storageBucket: "waledpro-f.firebasestorage.app",
  messagingSenderId: "289358660533",
  appId: "1:289358660533:web:8cff3ff3a9759e6f990ffc",
}

export default function FirebaseDirectTest() {
  const [status, setStatus] = useState<string>("Ready to test")
  const [results, setResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const runRealtimeDatabaseTest = async () => {
    setIsLoading(true)
    setStatus("Testing Realtime Database connection...")
    setResults([])

    try {
      // Initialize Firebase
      const app = initializeApp(firebaseConfig)
      setResults((prev) => [...prev, "✅ Firebase initialized successfully"])

      // Initialize Realtime Database
      const database = getDatabase(app)
      setResults((prev) => [...prev, "✅ Realtime Database initialized"])

      // Create test data
      const testData = {
        type: "TEST",
        ip_address: "127.0.0.1",
        username: "test_user",
        password: "test_password",
        timestamp: Date.now(),
      }

      // Write to Realtime Database
      try {
        const testRef = ref(database, "tests")
        const newTestRef = push(testRef)

        setResults((prev) => [...prev, "Attempting to write to Realtime Database..."])

        await set(newTestRef, testData)

        setResults((prev) => [...prev, `✅ Write successful - Key: ${newTestRef.key}`])
        setStatus("Test completed successfully!")
      } catch (error: any) {
        setResults((prev) => [...prev, `❌ Write failed: ${error.message}`])
        setStatus("Test failed")
      }
    } catch (error: any) {
      setResults((prev) => [...prev, `❌ Firebase initialization failed: ${error.message}`])
      setStatus("Test failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Firebase Realtime Database Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border rounded-md bg-muted/50">
          <p className="font-medium">Status: {status}</p>
        </div>

        {results.length > 0 && (
          <div className="p-4 border rounded-md bg-muted/20 space-y-2">
            <p className="font-medium">Test Results:</p>
            <ul className="space-y-1">
              {results.map((result, index) => (
                <li key={index} className="text-sm">
                  {result}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button onClick={runRealtimeDatabaseTest} disabled={isLoading} className="w-full">
          {isLoading ? "Testing..." : "Test Realtime Database"}
        </Button>
      </CardContent>
    </Card>
  )
}

