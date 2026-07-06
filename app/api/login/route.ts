import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth-middleware";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (request.headers.get("authorization")) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }
    if (!checkRateLimit(ip)) {
      return rateLimitResponse();
    }

    const { email, password } = await request.json();

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    await signInWithEmailAndPassword(auth, email, password);
    return NextResponse.json({ message: "Login successful" }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }
}
