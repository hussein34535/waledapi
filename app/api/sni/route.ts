import { NextRequest, NextResponse } from "next/server";
import { adminDatabase } from "@/lib/firebase-admin";
import { verifyAuthToken, securityCheck } from "@/lib/security";
import { z } from "zod";

const postSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  host: z.string().min(1).max(253).trim(),
});

const putSchema = z.object({
  id: z.string().min(1).max(50).trim().regex(/^[a-zA-Z0-9_-]+$/),
  host: z.string().min(1).max(253).trim().regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
});

const CSRF_TOKENS = new Map<string, number>();

function generateCsrfToken(): string {
  const token = Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join("");
  CSRF_TOKENS.set(token, Date.now());
  return token;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const blocked = await securityCheck(req, body);
  if (blocked) return blocked;

  const user = await verifyAuthToken(req);
  if (!user) return unauthorizedResponse();

  if (!adminDatabase) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }

  try {
    const parsedData = postSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { name, host } = parsedData.data;
    const existing = await adminDatabase.ref(`sni/${name}`).once("value");
    if (existing.exists()) {
      return NextResponse.json({ error: "Name already exists" }, { status: 409 });
    }

    await adminDatabase.ref(`sni/${name}`).set({
      host,
      createdBy: user.uid,
      createdAt: Date.now(),
    });

    return NextResponse.json({ message: "SNI added successfully", csrf: generateCsrfToken() }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const blocked = await securityCheck(req);
  if (blocked) return blocked;

  const user = await verifyAuthToken(req);
  if (!user) return unauthorizedResponse();

  if (!adminDatabase) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }

  try {
    const snapshot = await adminDatabase.ref("sni").once("value");
    if (snapshot.exists()) {
      const data = snapshot.val();
      const sniList = Object.keys(data).map(key => ({
        id: key,
        host: data[key].host,
      }));
      return NextResponse.json(sniList, { status: 200 });
    }
    return NextResponse.json([], { status: 200 });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const blocked = await securityCheck(req, body);
  if (blocked) return blocked;

  const user = await verifyAuthToken(req);
  if (!user) return unauthorizedResponse();

  if (!adminDatabase) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }

  try {
    const parsedData = putSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { id, host } = parsedData.data;
    await adminDatabase.ref(`sni/${id}`).update({
      host,
      updatedBy: user.uid,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ message: "SNI updated successfully" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const blocked = await securityCheck(req, body);
  if (blocked) return blocked;

  const user = await verifyAuthToken(req);
  if (!user) return unauthorizedResponse();

  if (!adminDatabase) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await adminDatabase.ref(`sni/${id}`).remove();
    return NextResponse.json({ message: "SNI deleted successfully" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
