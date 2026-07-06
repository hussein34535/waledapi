import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    const accountsRef = ref(database, 'vpsAccounts');

    let dataSnapshot;
    if (forceRefresh) {
      const refreshRef = ref(database, `vpsAccounts?_ts=${Date.now()}`);
      try {
        dataSnapshot = await get(refreshRef);
      } catch (error) {
        console.log("Refresh reference failed, using standard reference");
        dataSnapshot = await get(accountsRef);
      }
    } else {
      dataSnapshot = await get(accountsRef);
    }

    const response = NextResponse.json(
      dataSnapshot.exists()
        ? Object.values(dataSnapshot.val()).filter((account: any) =>
            account.type && account.type.toLowerCase() === 'vmess'
          )
        : []
    );

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    response.headers.set('X-Refresh-Hint', 'Add ?refresh=true to force data refresh');
    response.headers.set('X-Data-Time', new Date().toISOString());

    return response;
  } catch (error) {
    console.error('Error fetching VMess accounts:', error);
    return new NextResponse('Internal Server Error', {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  }
}
