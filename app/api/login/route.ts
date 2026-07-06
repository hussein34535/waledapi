import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { securityCheck, verifyAuthToken, validateEmail } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, honeypot, timestamp } = body;

    if (honeypot) {
      await new Promise(resolve => setTimeout(resolve, 30000));
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    if (!timestamp || Date.now() - parseInt(timestamp) < 2000 || Date.now() - parseInt(timestamp) > 60000) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const blocked = await securityCheck(request, body, true);
    if (blocked) return blocked;

    if (request.headers.get("authorization")) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    if (email.length > 254 || password.length > 128) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const passwordChecks = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/];
    const hasMinComplexity = passwordChecks.filter(c => c.test(password)).length >= 2;
    if (!hasMinComplexity) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    await signInWithEmailAndPassword(auth, email, password);
    return NextResponse.json({ message: "Login successful" }, { status: 200 });
  } catch {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }
}
