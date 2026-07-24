import { NextResponse } from "next/server";
import { securityCheck, validateEmail } from "@/lib/security";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128).optional(),
  honeypot: z.string().optional(),
  timestamp: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check rate limit & threat detection
    const blocked = await securityCheck(request, body, true);
    if (blocked) return blocked;

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid request payload" }, { status: 400 });
    }

    const { email, honeypot } = parsed.data;

    // Honeypot check: If bot filled the hidden field, return 400 immediately without artificial delay
    if (honeypot && honeypot.trim() !== "") {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ message: "Invalid email address" }, { status: 400 });
    }

    return NextResponse.json({ message: "Security check passed" }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
