import { NextRequest, NextResponse } from 'next/server';
import { adminDatabase } from '@/lib/firebase-admin';
import { verifyAuthToken } from '@/lib/security';
import { formatServerWithFlag } from '@/lib/flags';

export async function GET(req: NextRequest) {
  const user = await verifyAuthToken(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!adminDatabase) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  try {
    const snapshot = await adminDatabase.ref('vpsAccounts').once('value');
    const items = snapshot.exists()
      ? Object.values(snapshot.val())
          .filter((a: any) => a && typeof a === 'object' && a.type === 'VLESS')
          .map((a: any) => formatServerWithFlag(a))
      : [];
    const response = NextResponse.json(items);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (e) {
    console.error('[vless] error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
