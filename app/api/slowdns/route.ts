import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { verifyAuthToken } from '@/lib/security';

export async function GET(req: NextRequest) {
  const user = await verifyAuthToken(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const snapshot = await get(ref(database, 'vpsAccounts'));
    const response = NextResponse.json(
      snapshot.exists()
        ? Object.values(snapshot.val()).filter((a: any) => a.type === 'SLOWDNS')
        : []
    );
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
