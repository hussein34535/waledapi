import { NextRequest, NextResponse } from "next/server";
import { adminDatabase } from "@/lib/firebase-admin";
import { verifyAuthToken, securityCheck } from "@/lib/security";

export async function GET(req: NextRequest) {
  const blocked = await securityCheck(req);
  if (blocked) return blocked;

  const user = await verifyAuthToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!adminDatabase) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }

  try {
    const sniSnap = await adminDatabase.ref("sni").once("value");
    const sniCount = sniSnap.exists() ? Object.keys(sniSnap.val()).length : 0;

    const vpsSnap = await adminDatabase.ref("vpsAccounts").once("value");
    let vpsCount = 0;
    let vpsActive = 0;
    if (vpsSnap.exists()) {
      const vpsData = vpsSnap.val();
      vpsCount = Object.keys(vpsData).length;
      for (const key of Object.keys(vpsData)) {
        if (vpsData[key].status === "active") vpsActive++;
      }
    }

    return NextResponse.json({
      sniCount,
      vpsCount,
      vpsActive,
    }, { status: 200 });
  } catch (err) {
    console.error("Analytics stats error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
