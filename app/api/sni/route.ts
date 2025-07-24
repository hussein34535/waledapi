import { NextRequest, NextResponse } from "next/server";
import { adminDatabase } from "@/lib/firebase-admin";
import { z } from "zod";

const sniSchema = z.object({
  name: z.string().min(1),
  host: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsedData = sniSchema.safeParse(body);

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
