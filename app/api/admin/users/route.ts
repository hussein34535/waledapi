import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getAuth } from "firebase-admin/auth"
import type { DecodedIdToken } from "firebase-admin/auth"

const ADMIN_EMAILS = ["darkshadowdx3@gmail.com", "waledpro.f@gmail.com"]

async function checkAdmin(request: NextRequest): Promise<DecodedIdToken | null> {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  const token = authHeader.split("Bearer ")[1]
  try {
    const decoded = await getAuth().verifyIdToken(token)
    const isAdmin =
      (decoded.email && ADMIN_EMAILS.includes(decoded.email)) ||
      (decoded.uid && await checkFirestoreAdmin(decoded.uid))
    return isAdmin ? decoded : null
  } catch {
    return null
  }
}

async function checkFirestoreAdmin(uid: string): Promise<boolean> {
  try {
    if (!adminDb) return false
    const doc = await adminDb.collection("admins").doc(uid).get()
    return doc.exists
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const admin = await checkAdmin(request)
  if (!admin) return NextResponse.json({ error: "غير مصرح" }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.toLowerCase() || ""

    if (!adminDb) return NextResponse.json({ error: "قاعدة البيانات غير متاحة" }, { status: 500 })

    const listResult = await getAuth().listUsers(1000)
    const firestoreUsers = await adminDb.collection("users").get()
    const fsMap = new Map<string, any>()
    firestoreUsers.forEach((doc: any) => fsMap.set(doc.id, doc.data()))

    const users = listResult.users
      .map((u) => {
        const fs = fsMap.get(u.uid) || {}
        return {
          uid: u.uid,
          email: u.email || null,
          displayName: u.displayName || null,
          photoURL: u.photoURL || null,
          isPremium: fs.isPremium === true,
          isBanned: fs.isBanned === true,
          premiumActivatedAt: fs.premiumActivatedAt || null,
          premiumActivatedBy: fs.premiumActivatedBy || null,
        }
      })
      .filter((u) => {
        if (!search) return true
        return (u.email?.toLowerCase().includes(search) ||
                u.displayName?.toLowerCase().includes(search))
      })
      .sort((a, b) => {
        if (a.isBanned !== b.isBanned) return a.isBanned ? 1 : -1
        if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1
        return (a.displayName || a.email || "").localeCompare(b.displayName || b.email || "")
      })

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error("Failed to list users:", error)
    return NextResponse.json({ error: "فشل في تحميل المستخدمين" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await checkAdmin(request)
  if (!admin) return NextResponse.json({ error: "غير مصرح" }, { status: 403 })

  try {
    const { uid, field, value } = await request.json()
    if (!uid || !field) return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 })
    if (!["isPremium", "isBanned"].includes(field)) return NextResponse.json({ error: "حقل غير صالح" }, { status: 400 })

    const update: Record<string, any> = { [field]: value }
    if (field === "isPremium" && value === true) {
      update.premiumActivatedAt = new Date().toISOString()
      update.premiumActivatedBy = admin.email || admin.uid
    }

    if (!adminDb) return NextResponse.json({ error: "قاعدة البيانات غير متاحة" }, { status: 500 })
    await adminDb.collection("users").doc(uid).set(update, { merge: true })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Failed to update user:", error)
    return NextResponse.json({ error: "فشل في تحديث المستخدم" }, { status: 500 })
  }
}
