import { NextRequest, NextResponse } from "next/server";
import { adminDatabase } from "@/lib/firebase-admin";
import { verifyAuthToken } from "@/lib/security";

const DEFAULT_DATA = {
  SSH: { monthly: 15, quarterly: 40, yearly: 150 },
  VMESS: { monthly: 12, quarterly: 32, yearly: 120 },
  VLESS: { monthly: 12, quarterly: 32, yearly: 120 },
  SLOWDNS: { monthly: 18, quarterly: 48, yearly: 180 },
  subscription: { yearly_price: 50, currency: "ج.م" },
};

export async function POST(req: NextRequest) {
  if (!adminDatabase) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }

  const user = await verifyAuthToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await adminDatabase.ref("config/pricing").set(DEFAULT_DATA);
    return NextResponse.json({ message: "Default pricing initialized", data: DEFAULT_DATA });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
