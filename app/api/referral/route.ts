import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, referralCode, hardwareFingerprint, deviceModel, isPhysicalDevice } = body;

    // 1. Basic validation
    if (!uid || !referralCode || typeof referralCode !== "string") {
      return NextResponse.json(
        { success: false, error: "بيانات الإحالة غير مكتملة." },
        { status: 400 }
      );
    }

    const cleanCode = referralCode.trim().toUpperCase();

    // 2. Physical device check
    if (isPhysicalDevice === false) {
      return NextResponse.json(
        { success: false, error: "عفواً: غير مسموح بالاستفادة من نظام الإحالات عبر المحاكيات." },
        { status: 403 }
      );
    }

    // 3. Hardware fingerprint anti-fraud check in Firestore
    if (adminDb && hardwareFingerprint) {
      const claimRef = adminDb.collection("referral_claims").doc(hardwareFingerprint);
      const claimDoc = await claimRef.get();

      if (claimDoc.exists) {
        return NextResponse.json(
          {
            success: false,
            error: "عفواً: تم استخدام كود الإحالة مسبقاً من هذا الجهاز المادي.",
          },
          { status: 400 }
        );
      }

      // Check user self-claim
      const userRef = adminDb.collection("users").doc(uid);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.referralCode === cleanCode) {
          return NextResponse.json(
            { success: false, error: "عفواً: لا يمكنك تفعيل كود الإحالة الخاص بك!" },
            { status: 400 }
          );
        }
        if (userData?.referredBy) {
          return NextResponse.json(
            { success: false, error: "لقد قمت بتفعيل كود إحالة سابقاً من هذا الحساب." },
            { status: 400 }
          );
        }
      }

      // 4. Save Claim Document to prevent duplicate device fraud
      await claimRef.set({
        uid,
        referralCode: cleanCode,
        deviceModel: deviceModel || "Unknown",
        claimedAt: new Date().toISOString(),
      });

      // 5. Update user document in Firestore with 30 Days (720h) Premium Bonus
      if (userDoc.exists) {
        await userRef.update({
          referredBy: cleanCode,
          isPremium: true,
          premiumExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "تم تفعيل كود الإحالة والحصول على اشتراك بريميوم لمدة شهر كامل (30 يوم)! 🎉",
        bonusHours: 720,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Referral API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء معالجة طلب الإحالة. يرجى المحاولة لاحقاً.",
      },
      { status: 500 }
    );
  }
}
