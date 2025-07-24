import { NextRequest, NextResponse } from "next/server";
import { adminDatabase } from "@/lib/firebase-admin";
import { z } from "zod";

const postSchema = z.object({
  name: z.string().min(1),
  host: z.string().min(1),
});

const putSchema = z.object({
  id: z.string().min(1),
  host: z.string().min(1),
});

export async function POST(req: NextRequest) {
  if (!adminDatabase) {
    return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
  }
  try {
    const body = await req.json();
    const parsedData = postSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(parsedData.error, { status: 400 });
    }

    const { name, host } = parsedData.data;

    const sniRef = adminDatabase.ref(`sni/${name}`);
    await sniRef.set({ host });

    return NextResponse.json({ message: "SNI added successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error adding SNI:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  if (!adminDatabase) {
    return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
  }
  try {
    const sniRef = adminDatabase.ref('sni');
    const snapshot = await sniRef.once('value');
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const sniList = Object.keys(data).map(key => ({
        id: key,
        host: data[key].host,
      }));
      return NextResponse.json(sniList, { status: 200 });
    } else {
      return NextResponse.json([], { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching SNI list:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!adminDatabase) {
    return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
  }
  try {
    const body = await req.json();
    const parsedData = putSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(parsedData.error, { status: 400 });
    }

    const { id, host } = parsedData.data;
    const sniRef = adminDatabase.ref(`sni/${id}`);
    await sniRef.set({ host });

    return NextResponse.json({ message: "SNI updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating SNI:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!adminDatabase) {
    return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const sniRef = adminDatabase.ref(`sni/${id}`);
    await sniRef.remove();

    return NextResponse.json({ message: "SNI deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting SNI:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
