import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

export async function GET(req: NextRequest) {
  try {
    // Get refresh parameter from URL if present
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    // Create a reference with cache control options
    const accountsRef = ref(database, 'vpsAccounts');
    
    // Force a refresh by adding a timestamp to the reference path if requested
    let dataSnapshot;
    if (forceRefresh) {
      const refreshRef = ref(database, `vpsAccounts?_ts=${Date.now()}`);
      // Try to get data with the refresh reference first
      try {
        dataSnapshot = await get(refreshRef);
      } catch (error) {
        // If that fails, fall back to regular reference
        console.log("Refresh reference failed, using standard reference");
        dataSnapshot = await get(accountsRef);
      }
    } else {
      dataSnapshot = await get(accountsRef);
    }

    // Create response with data
    const response = NextResponse.json(
      dataSnapshot.exists() 
        ? Object.values(dataSnapshot.val()).filter((account: any) => 
            account.type && account.type.toLowerCase() === 'trojan'
          )
        : []
    );

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    
    // Add refresh hint in headers
    response.headers.set('X-Refresh-Hint', 'Add ?refresh=true to force data refresh');
    response.headers.set('X-Data-Time', new Date().toISOString());

    return response;
  } catch (error) {
    console.error('Error fetching accounts:', error);
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