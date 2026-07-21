import { NextRequest, NextResponse } from "next/server";
import { adminDatabase } from "@/lib/firebase-admin";
import { verifyAuthToken, securityCheck } from "@/lib/security";
import { z } from "zod";

const pricingSchema = z.record(z.union([
  z.object({
    monthly: z.number().min(0),
    quarterly: z.number().min(0),
    yearly: z.number().min(0),
  }),
  z.object({
    yearly_price: z.number().min(0),
    currency: z.string(),
  }),
]));

export async function GET() {
  if (!adminDatabase) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
  try {
    const snap = await adminDatabase.ref("config/pricing").once("value");
    return NextResponse.json(snap.val() || {}, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const blocked = await securityCheck(req, body);
  if (blocked) return blocked;

  const user = await verifyAuthToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!adminDatabase) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }

  try {
    const parsed = pricingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    await adminDatabase.ref("config/pricing").set(parsed.data);
    return NextResponse.json({ message: "Pricing updated" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
