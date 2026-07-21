"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { ref, onValue } from "firebase/database"
import { useRouter } from "next/navigation"
import type { VpsAccount } from "@/lib/types"
import { useAuth } from "@/components/auth-provider"
import { database } from "@/lib/firebase"
import { Layers, Activity, Clock, BarChart3, AlertTriangle, ChevronLeft, Wifi, Terminal, Globe } from "lucide-react"

type AccountType = "SSH" | "VMESS" | "VLESS" | "SLOWDNS"

const TYPE_META: Record<string, { label: string; icon: any; bar: string }> = {
  SSH: { label: "SSH", icon: Terminal, bar: "bg-[#007AFF]" },
  VMESS: { label: "VMess", icon: Wifi, bar: "bg-[#AF52DE]" },
  VLESS: { label: "VLESS", icon: Wifi, bar: "bg-[#34C759]" },
  SLOWDNS: { label: "SlowDNS", icon: Globe, bar: "bg-[#FF9500]" },
}

const SECTION_ORDER: AccountType[] = ["SSH", "VMESS", "VLESS", "SLOWDNS"]

export default function DashboardOverview() {
  const { user } = useAuth()
  const router = useRouter()
  const [accounts, setAccounts] = useState<VpsAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) { setIsLoading(true); return }
    setError(null)
    const accountsRef = ref(database, "vpsAccounts")
    const unsub = onValue(accountsRef, (snapshot) => {
      const data: VpsAccount[] = []
      if (snapshot.exists()) {
        snapshot.forEach((child) => { data.push({ id: child.key, ...child.val() }) })
        data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      }
      setAccounts(data)
      setIsLoading(false)
    }, (err) => { setError(err.message); setIsLoading(false) })
    return () => unsub()
  }, [user])

  const totalAccounts = accounts.length
  const totalActive = accounts.filter((a) => a.status === "active").length
  const getByType = (type: AccountType) => accounts.filter((a) => a.type === type)

  const soonExpiring = accounts.filter(a => {
    if (!a.expiry_date || a.status !== "active") return false
    const diff = new Date(a.expiry_date).getTime() - Date.now()
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000
  })

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-5 pt-10">
        <div className="space-y-4">
          <div className="h-8 w-32 rounded-lg bg-[#e5e5ea] dark:bg-[#2c2c2e] animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-4">
                <div className="h-4 w-16 rounded bg-[#e5e5ea] dark:bg-[#2c2c2e] mb-3 animate-pulse" />
                <div className="h-7 w-10 rounded bg-[#e5e5ea] dark:bg-[#2c2c2e] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-5 pt-10">
        <div className="rounded-2xl bg-[#ff3b30]/5 border border-[#ff3b30]/10 p-6 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-[#ff3b30] shrink-0" />
          <p className="text-sm text-[#ff3b30] flex-1">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-medium text-[#ff3b30] shrink-0">إعادة</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-5 pt-10">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight leading-[1.1]">لوحة التحكم</h1>
        <p className="text-[#86868b] dark:text-[#98989d] text-[15px] mt-1">مرحباً بعودتك</p>
      </div>

      {totalAccounts === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-10 text-center">
          <div className="h-16 w-16 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] flex items-center justify-center mx-auto mb-4">
            <Layers className="h-8 w-8 text-[#86868b] dark:text-[#98989d]" />
          </div>
          <h2 className="text-lg font-bold mb-1">لا توجد حسابات</h2>
          <p className="text-sm text-[#86868b] dark:text-[#98989d] mb-6">أضف حسابك الأول للبدء</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { label: "إجمالي الحسابات", value: totalAccounts, icon: Layers, color: "#007AFF" },
              { label: "نشط حالياً", value: totalActive, icon: Activity, color: "#34C759" },
              { label: "SSH", value: getByType("SSH").length, icon: Terminal, color: "#007AFF" },
              { label: "VMess", value: getByType("VMESS").length, icon: Wifi, color: "#AF52DE" },
              { label: "VLESS", value: getByType("VLESS").length, icon: Wifi, color: "#34C759" },
              { label: "SlowDNS", value: getByType("SLOWDNS").length, icon: Globe, color: "#FF9500" },
            ].filter(s => s.label.startsWith("إجمالي") || s.label.startsWith("نشط") || s.value > 0).map((s, i) => (
              <div key={s.label} className="rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}14` }}>
                    <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                  </div>
                </div>
                <p className="text-[26px] font-bold tracking-tight tabular-nums">{s.value}</p>
                <p className="text-[13px] text-[#86868b] dark:text-[#98989d] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Distribution */}
          <div className="rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-5 mb-4">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="h-4 w-4 text-[#86868b] dark:text-[#98989d]" />
              <h3 className="text-sm font-semibold">توزيع الأنواع</h3>
            </div>
            <div className="space-y-4">
              {SECTION_ORDER.map((type) => {
                const meta = TYPE_META[type]
                const count = getByType(type).length
                if (count === 0) return null
                const pct = Math.round((count / totalAccounts) * 100)
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{meta.label}</span>
                      <span className="text-xs text-[#86868b] dark:text-[#98989d] tabular-nums">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#e5e5ea] dark:bg-[#2c2c2e] overflow-hidden">
                      <div className={`h-full rounded-full ${meta.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Expiring */}
          {soonExpiring.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-5 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-[#FF9500]" />
                <h3 className="text-sm font-semibold">على وشك الانتهاء</h3>
                <span className="text-xs text-[#86868b] dark:text-[#98989d] mr-auto">{soonExpiring.length}</span>
              </div>
              <div className="space-y-1.5">
                {soonExpiring.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e]/50 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#FF9500] shrink-0" />
                      <span className="font-medium truncate">{a.server_name}</span>
                    </div>
                    <span className="text-xs text-[#86868b] dark:text-[#98989d] shrink-0 mr-3 tabular-nums">{a.expiry_date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => router.push("/dashboard/accounts")}
              className="rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-4 text-right hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">الحسابات</span>
                <ChevronLeft className="h-4 w-4 text-[#86868b] dark:text-[#98989d]" />
              </div>
              <p className="text-xs text-[#86868b] dark:text-[#98989d] mt-1">إدارة {totalAccounts} حساب</p>
            </button>
            <button onClick={() => router.push("/dashboard/pricing")}
              className="rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-4 text-right hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">الأسعار</span>
                <ChevronLeft className="h-4 w-4 text-[#86868b] dark:text-[#98989d]" />
              </div>
              <p className="text-xs text-[#86868b] dark:text-[#98989d] mt-1">إدارة الاشتراكات</p>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
