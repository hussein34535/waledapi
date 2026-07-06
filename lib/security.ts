const BLACKLIST_DURATION = 24 * 60 * 60 * 1000;
const TARPIT_INITIAL_DELAY = 1000;
const TARPIT_MAX_DELAY = 30000;
const MAX_FAILED_LOGIN_ATTEMPTS = 3;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const BLOCK_AFTER_BANS = 3;

interface ThreatEntry {
  count: number
  failedLogins: number
  firstSeen: number
  lastSeen: number
  resetAt: number
  blockedUntil: number
  banCount: number
  userAgents: Set<string>
  paths: Set<string>
}

const threatDb = new Map<string, ThreatEntry>()

function getIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown"
}

function getFingerprint(request: Request): string {
  const ip = getIp(request)
  const ua = request.headers.get("user-agent") || ""
  const accept = request.headers.get("accept") || ""
  return `${ip}|${ua.slice(0, 50)}|${accept.slice(0, 30)}`
}

function isBlacklisted(ip: string): boolean {
  const entry = threatDb.get(ip)
  if (!entry) return false
  if (entry.blockedUntil > Date.now()) return true
  if (entry.blockedUntil > 0 && entry.blockedUntil <= Date.now()) {
    threatDb.delete(ip)
    return false
  }
  return false
}

function markThreat(ip: string, isLogin: boolean = false): void {
  const now = Date.now()
  let entry = threatDb.get(ip)
  if (!entry) {
    entry = {
      count: 0,
      failedLogins: 0,
      firstSeen: now,
      lastSeen: now,
      resetAt: now + WINDOW_MS,
      blockedUntil: 0,
      banCount: 0,
      userAgents: new Set(),
      paths: new Set(),
    }
    threatDb.set(ip, entry)
  }

  entry.count++
  entry.lastSeen = now
  entry.userAgents.add(getUserAgentFromRequest(null, ip))

  if (isLogin) {
    entry.failedLogins++
    if (entry.failedLogins >= MAX_FAILED_LOGIN_ATTEMPTS) {
      entry.blockedUntil = now + (entry.banCount + 1) * 30 * 60 * 1000
      entry.banCount++
      entry.failedLogins = 0
    }
  }

  if (entry.count >= BLOCK_AFTER_BANS * MAX_REQUESTS_PER_WINDOW && entry.banCount >= BLOCK_AFTER_BANS) {
    entry.blockedUntil = now + BLACKLIST_DURATION
  }

  if (entry.count > 50 && entry.banCount > 0) {
    entry.blockedUntil = now + BLACKLIST_DURATION * 7
  }
}

function getUserAgentFromRequest(_req: null, _ip: string): string {
  return "unknown"
}

function detectAttack(path: string, body: any): string | null {
  const bodyStr = typeof body === "string" ? body : JSON.stringify(body || "")

  const attackPatterns: [RegExp, string][] = [
    [/\b(eval|exec|system|passthru|shell_exec|popen|proc_open)\s*\(/i, "command-injection"],
    [/['"]\s*(or|and)\s+['"]?['"]?\s*=/i, "sql-injection"],
    [/\b(alert|confirm|prompt)\s*\(/i, "xss"],
    [/%00|null|0x00/i, "null-byte"],
    [/\.\.\/|\.\.\\|\.\.%2f|\.\.%5c/i, "path-traversal"],
    [/\b(adminer|phpmyadmin|wp-admin|xmlrpc)\b/i, "admin-scanner"],
    [/['"]?\s*(union|select|insert|drop|delete|alter)\s/i, "sql-injection"],
    [/\b(lt|gt|le|ge|eq|ne|__proto__|constructor)\b/i, "prototype-pollution"],
    [/(\$\{|\${{|#\{)/, "template-injection"],
    [/[\x00-\x08\x0B\x0C\x0E-\x1F]/, "binary-attack"],
  ]

  for (const [pattern, type] of attackPatterns) {
    if (pattern.test(path) || pattern.test(bodyStr)) {
      return type
    }
  }
  return null
}

function getClientInfo(request: Request) {
  return {
    ip: getIp(request),
    ua: request.headers.get("user-agent") || "",
    accept: request.headers.get("accept") || "",
    acceptLanguage: request.headers.get("accept-language") || "",
    encoding: request.headers.get("accept-encoding") || "",
    referer: request.headers.get("referer") || "",
    origin: request.headers.get("origin") || "",
  }
}

export async function securityCheck(request: Request, body?: any, isLogin: boolean = false): Promise<Response | null> {
  const ip = getIp(request)
  const fingerprint = getFingerprint(request)
  const path = new URL(request.url).pathname

  if (isBlacklisted(ip)) {
    const entry = threatDb.get(ip)
    const remaining = entry ? Math.ceil((entry.blockedUntil - Date.now()) / 1000) : 3600
    const tarpitDelay = Math.min(TARPIT_INITIAL_DELAY * (entry?.banCount || 1), TARPIT_MAX_DELAY)
    await new Promise(resolve => setTimeout(resolve, tarpitDelay))
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(remaining),
        "X-Security-Status": "blocked",
      },
    })
  }

  const attackType = detectAttack(path, body)
  if (attackType) {
    markThreat(ip)
    const info = getClientInfo(request)
    console.warn(`[SECURITY] Attack detected: ${attackType} from ${info.ip} | UA: ${info.ua.slice(0, 80)} | Path: ${path}`)
    await new Promise(resolve => setTimeout(resolve, 5000))
    return new Response(JSON.stringify({ error: "Bad request" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "X-Security-Status": "attack-blocked" },
    })
  }

  if (isLogin) {
    if (!checkLoginRateLimit(ip)) {
      markThreat(ip, true)
      const attempts = threatDb.get(ip)?.failedLogins || 0
      await new Promise(resolve => setTimeout(resolve, attempts * 2000))
      return new Response(JSON.stringify({ error: "Too many attempts" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "300",
          "X-RateLimit-Status": "exceeded",
        },
      })
    }
  } else {
    if (!checkGeneralRateLimit(ip)) {
      markThreat(ip)
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "60" },
      })
    }
  }

  const entry = threatDb.get(ip)
  if (entry) {
    entry.paths.add(path)
  }

  return null
}

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now()
  let entry = threatDb.get(ip)
  if (!entry || now > entry.resetAt) {
    threatDb.set(ip, { count: 0, failedLogins: 0, firstSeen: now, lastSeen: now, resetAt: now + WINDOW_MS, blockedUntil: 0, banCount: 0, userAgents: new Set(), paths: new Set() })
    return true
  }
  return entry.failedLogins < MAX_FAILED_LOGIN_ATTEMPTS
}

function checkGeneralRateLimit(ip: string): boolean {
  const now = Date.now()
  let entry = threatDb.get(ip)
  if (!entry || now > entry.resetAt) {
    threatDb.set(ip, { count: 0, failedLogins: 0, firstSeen: now, lastSeen: now, resetAt: now + WINDOW_MS, blockedUntil: 0, banCount: 0, userAgents: new Set(), paths: new Set() })
    return true
  }
  return entry.count < MAX_REQUESTS_PER_WINDOW
}

export function rateLimitResponse() {
  return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": "300", "Cache-Control": "no-store" },
  })
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  })
}

export async function verifyAuthToken(request: Request): Promise<{ uid: string; email: string } | null> {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null
    const idToken = authHeader.split("Bearer ")[1]
    if (!idToken || idToken.length < 20) return null
    const { getAuth } = await import("firebase-admin/auth")
    const decodedToken = await getAuth().verifyIdToken(idToken, true)
    return { uid: decodedToken.uid, email: decodedToken.email || "unknown" }
  } catch { return null }
}

export function getThreatStats() {
  const stats: any[] = []
  for (const [ip, entry] of threatDb) {
    stats.push({
      ip,
      requests: entry.count,
      failedLogins: entry.failedLogins,
      blocked: entry.blockedUntil > Date.now(),
      blockedUntil: entry.blockedUntil > Date.now() ? new Date(entry.blockedUntil).toISOString() : null,
      banCount: entry.banCount,
      firstSeen: new Date(entry.firstSeen).toISOString(),
      lastSeen: new Date(entry.lastSeen).toISOString(),
      paths: Array.from(entry.paths),
    })
  }
  return stats.sort((a, b) => b.requests - a.requests)
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return false
  if (email.length > 254) return false
  const disposableDomains = ["mailinator.com", "guerrillamail.com", "tempmail.com", "throwaway.email", "yopmail.com", "10minutemail.com", "sharklasers.com"]
  const domain = email.split("@")[1]?.toLowerCase()
  if (domain && disposableDomains.includes(domain)) return false
  return true
}
