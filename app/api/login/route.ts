import { NextResponse } from "next/server";
import { securityCheck, validateEmail } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, honeypot, timestamp } = body;

    if (honeypot) {
      await new Promise(resolve => setTimeout(resolve, 30000));
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    if (!timestamp || typeof timestamp !== "string") {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const ts = parseInt(timestamp, 10);
    const elapsed = Date.now() - ts;
    if (isNaN(ts) || elapsed > 120000) {
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

    return NextResponse.json({ message: "Login successful" }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }
}
