const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
const LOGIN_MAX_REQUESTS = 5;
const ipRequests = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string, isLogin: boolean = false): boolean {
  const now = Date.now();
  const entry = ipRequests.get(ip);
  const maxRequests = isLogin ? LOGIN_MAX_REQUESTS : MAX_REQUESTS_PER_WINDOW;

  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

export function rateLimitResponse() {
  return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": "60",
      "Cache-Control": "no-store",
    },
  });
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export async function verifyAuthToken(request: Request): Promise<{ uid: string; email: string } | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const idToken = authHeader.split("Bearer ")[1];
    if (!idToken || idToken.length < 20) {
      return null;
    }

    const { getAuth } = await import("firebase-admin/auth");
    const decodedToken = await getAuth().verifyIdToken(idToken, true);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || "unknown",
    };
  } catch {
    return null;
  }
}
