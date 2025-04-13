"use client"

import { useState } from "react"
import { collection, addDoc, getDocs, getFirestore } from "firebase/firestore"
import { initializeApp } from "firebase/app"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Direct Firebase config to ensure no issues with imports
const firebaseConfig = {
  apiKey: "AIzaSyDRNcrIOz8mUHRqQk4d_JUualOIIBc9w4E",
  authDomain: "waledpro-f.firebaseapp.com",
  databaseURL: "https://waledpro-f-default-rtdb.firebaseio.com",
  projectId: "waledpro-f",
  storageBucket: "waledpro-f.firebasestorage.app",
  messagingSenderId: "289358660533",
  appId: "1:289358660533:web:8cff3ff3a9759e6f990ffc",
}

export default function FirebaseTest() {
  const [status, setStatus] = useState<string>("Ready to test")
  const [results, setResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addTestDocument = async () => {
    setIsLoading(true)
    setStatus("Testing Firestore connection...")
    setResults([])

    try {
      // Initialize Firebase directly in this component
      const app = initializeApp(firebaseConfig)
      const db = getFirestore(app)

      setResults((prev) => [...prev, "✅ Firebase initialized successfully"])

      // Test reading from Firestore
      try {
        const querySnapshot = await getDocs(collection(db, "vpsAccounts"))
        setResults((prev) => [...prev, `✅ Read test successful - Found ${querySnapshot.size} documents`])
      } catch (error: any) {
        setResults((prev) => [...prev, `❌ Read test failed: ${error.message}`])
      }

      // Test writing to Firestore
      try {
        const testData = {
          type: "TEST",
          ip_address: "127.0.0.1",
          username: "test_user",
          password: "test_password",
          expiry_date: new Date().toISOString().split("T")[0],
          status: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        const docRef = await addDoc(collection(db, "vpsAccounts"), testData)
        setResults((prev) => [...prev, `✅ Write test successful - Document ID: ${docRef.id}`])
        setStatus("All tests completed successfully!")
      } catch (error: any) {
        setResults((prev) => [...prev, `❌ Write test failed: ${error.message}`])
        setStatus("Tests completed with errors")
      }
    } catch (error: any) {
      setResults((prev) => [...prev, `❌ Firebase initialization failed: ${error.message}`])
      setStatus("Tests failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Firebase Connection Test</CardTitle>
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

        <Button onClick={addTestDocument} disabled={isLoading} className="w-full">
          {isLoading ? "Testing..." : "Run Firestore Test"}
        </Button>
      </CardContent>
    </Card>
  )
}

