import { NextResponse } from "next/server";

import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  try {
    // Directly sign in using Firebase's authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return NextResponse.json({ message: "Login successful", user: userCredential.user }, { status: 200 });
  } catch (error: any) {
      console.error("Login error:", error); // Add logging
      return NextResponse.json({
          message: error.message || "Invalid credentials",
          code: error.code, // Include error code
          details: error.customData // Include any additional details
      }, { status: 401 });
  }
}