"use client"

import { ArrowLeft, Copy, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Endpoint = { method: string; path: string; desc: string; auth?: string; body?: any; params?: any; response: any; note?: string }
const endpoints: Endpoint[] = [
  {
    method: "POST",
    path: "/api/login",
    desc: "مصادقة المستخدم",
    body: { email: "string", password: "string", honeypot: "string (optional)", timestamp: "string" },
    response: { message: "Login successful" },
    note: "بعد نجاح الـ API، استخدم Firebase Auth على العميل لتسجيل الدخول الفعلي.",
  },
  {
    method: "GET",
    path: "/api/vps-accounts",
    desc: "جميع حسابات VPS",
    auth: "Bearer token (Firebase ID Token)",
    response: "{ [id: string]: VpsAccount }",
  },
  {
    method: "GET",
    path: "/api/ssh",
    desc: "حسابات SSH فقط",
    auth: "Bearer token (Firebase ID Token)",
    response: "VpsAccount[]",
  },
  {
    method: "GET",
    path: "/api/vmess",
    desc: "حسابات VMess فقط",
    auth: "Bearer token (Firebase ID Token)",
    response: "VpsAccount[]",
  },
  {
    method: "GET",
    path: "/api/vless",
    desc: "حسابات VLESS فقط",
    auth: "Bearer token (Firebase ID Token)",
    response: "VpsAccount[]",
  },
  {
    method: "GET",
    path: "/api/slowdns",
    desc: "حسابات SlowDNS فقط",
    auth: "Bearer token (Firebase ID Token)",
    response: "VpsAccount[]",
  },
  {
    method: "GET",
    path: "/api/sni",
    desc: "جميع إعدادات SNI",
    auth: "Bearer token (Firebase ID Token)",
    response: "[{ id: string, host: string }]",
  },
  {
    method: "POST",
    path: "/api/sni",
    desc: "إضافة SNI جديد",
    auth: "Bearer token (Firebase ID Token)",
    body: { name: "string (a-zA-Z0-9_-)", host: "string (domain)" },
    response: { message: "SNI added successfully", csrf: "string" },
  },
  {
    method: "PUT",
    path: "/api/sni",
    desc: "تحديث SNI",
    auth: "Bearer token (Firebase ID Token)",
    body: { id: "string", host: "string" },
    response: { message: "SNI updated successfully" },
  },
  {
    method: "DELETE",
    path: "/api/sni?id=...",
    desc: "حذف SNI",
    auth: "Bearer token (Firebase ID Token)",
    response: { message: "SNI deleted successfully" },
  },
]

const VpsAccountShape = `
{
  id: string
  type: "SSH" | "VMESS" | "VLESS" | "SLOWDNS"
  server_name: string
  ip_address: string
  username: string
  password: string
  expiry_date: string
  status: "active" | "inactive"
  createdAt: number
  updatedAt: number
  config?: string
  dns_ip?: string       // SLOWDNS only
  ns?: string           // SLOWDNS only
  public_key?: string   // SLOWDNS only
}`

export default function ApiDocs() {
  const router = useRouter()
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const copy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-24">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          رجوع
        </button>

        <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
        <p className="text-muted-foreground mb-8">جميع الـ endpoints المتاحة للتكامل مع التطبيقات الخارجية</p>

        <div className="space-y-6">
          {endpoints.map((ep, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border/50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                  ep.method === "GET" ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
                }`}>
                  {ep.method}
                </span>
                <code className="text-sm font-mono">{ep.path}</code>
                <button onClick={() => copy(ep.path, i)} className="mr-auto h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                  {copiedIdx === i ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{ep.desc}</p>

              {ep.auth && (
                <div className="mb-3">
                  <span className="text-xs font-medium text-muted-foreground">Auth: </span>
                  <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{ep.auth}</code>
                </div>
              )}

              {ep.params && (
                <div className="mb-3">
                  <span className="text-xs font-medium text-muted-foreground block mb-1">Parameters:</span>
                  <pre className="text-xs font-mono bg-muted/50 p-2 rounded-xl overflow-x-auto">{JSON.stringify(ep.params, null, 2)}</pre>
                </div>
              )}

              {ep.body && (
                <div className="mb-3">
                  <span className="text-xs font-medium text-muted-foreground block mb-1">Request Body:</span>
                  <pre className="text-xs font-mono bg-muted/50 p-2 rounded-xl overflow-x-auto">{JSON.stringify(ep.body, null, 2)}</pre>
                </div>
              )}

              <div>
                <span className="text-xs font-medium text-muted-foreground block mb-1">Response:</span>
                <pre className="text-xs font-mono bg-muted/50 p-2 rounded-xl overflow-x-auto">{typeof ep.response === "string" ? ep.response : JSON.stringify(ep.response, null, 2)}</pre>
              </div>

              {ep.note && (
                <p className="text-xs text-amber-500 mt-2">{ep.note}</p>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-card border border-border/50 p-5 mt-6">
          <h2 className="font-semibold mb-3">VpsAccount Shape</h2>
          <pre className="text-xs font-mono bg-muted/50 p-3 rounded-xl overflow-x-auto whitespace-pre">{VpsAccountShape}</pre>
        </div>

        <div className="rounded-2xl bg-card border border-border/50 p-5 mt-4">
          <h2 className="font-semibold mb-3">Integration Example (cURL)</h2>
          <pre className="text-xs font-mono bg-muted/50 p-3 rounded-xl overflow-x-auto whitespace-pre">{`# Option 1: Firebase ID Token (from client SDK)
curl https://waledapis.vercel.app/api/ssh \\
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"

# Option 2: HMAC Token (time-based, changes every request, secure)
# Client generates: hmac = HMAC-SHA256(secret, timestamp_ms)
# Sends: X-Auth-Token: <timestamp_ms>.<hmac_hex>
curl https://waledapis.vercel.app/api/ssh \\
  -H "X-Auth-Token: 1712345678000.abc123def456..."

# Option 3: Static API Key (server-to-server)
curl https://waledapis.vercel.app/api/slowdns \\
  -H "X-API-Key: <API_SECRET_KEY>"`}</pre>
        </div>

        <div className="rounded-2xl bg-card border border-border/50 p-5 mt-4">
          <h2 className="font-semibold mb-3">Important Notes</h2>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pr-4">
            <li>جميع الـ API endpoints محمية ومحتاجة توثيق</li>
            <li><strong>HMAC Token (الأفضل):</strong> الوقت + HMAC في <code className="text-xs bg-muted px-1 rounded">X-Auth-Token: &lt;ts&gt;.&lt;hmac&gt;</code> — يتغير كل طلب، ينتهي بعد 5 دقائق، حتى لو اتشافت الـ request ميتقدرش يعاد استخدامها</li>
            <li><strong>Bearer token:</strong> Firebase ID Token في <code className="text-xs bg-muted px-1 rounded">Authorization: Bearer &lt;token&gt;</code></li>
            <li><strong>API Key:</strong> مفتاح سري ثابت في <code className="text-xs bg-muted px-1 rounded">X-API-Key: &lt;key&gt;</code></li>
            <li>Firebase Realtime Database هي المخزن الرئيسي للبيانات</li>
            <li>API routes بتشتغل فقط على Vercel</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
