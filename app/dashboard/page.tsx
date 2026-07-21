"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { ref, onValue } from "firebase/database"
import { useRouter } from "next/navigation"
import type { VpsAccount } from "@/lib/types"
import { useAuth } from "@/components/auth-provider"
import { database } from "@/lib/firebase"
import { Layers, Activity, Clock, AlertTriangle, ChevronLeft, Server, Wifi, Terminal, Globe, BarChart3 } from "lucide-react"

type AccountType = "SSH" | "VMESS" | "VLESS" | "SLOWDNS"

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  SSH: { label: "SSH", icon: Terminal, color: "#007AFF" },
  VMESS: { label: "VMess", icon: Wifi, color: "#AF52DE" },
  VLESS: { label: "VLESS", icon: Wifi, color: "#34C759" },
  SLOWDNS: { label: "SlowDNS", icon: Globe, color: "#FF9500" },
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
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-4">
              <div className="h-4 w-12 rounded bg-[#e5e5ea] dark:bg-[#2c2c2e] mb-3 animate-pulse" />
              <div className="h-7 w-8 rounded bg-[#e5e5ea] dark:bg-[#2c2c2e] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="rounded-2xl bg-[#ff3b30]/5 border border-[#ff3b30]/10 p-5 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-[#ff3b30] shrink-0" />
          <p className="text-sm text-[#ff3b30] flex-1">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-medium text-[#ff3b30] shrink-0">إعادة</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 pb-12">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-xl font-bold">الرئيسية</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-[#007AFF]/10 flex items-center justify-center">
              <Server className="h-3.5 w-3.5 text-[#007AFF]" />
            </div>
          </div>
          <p className="text-2xl font-bold tabular-nums">{totalAccounts}</p>
          <p className="text-[12px] text-[#86868b] dark:text-[#98989d] mt-0.5">حساب</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-[#34C759]/10 flex items-center justify-center">
              <Activity className="h-3.5 w-3.5 text-[#34C759]" />
            </div>
          </div>
          <p className="text-2xl font-bold tabular-nums">{totalActive}</p>
          <p className="text-[12px] text-[#86868b] dark:text-[#98989d] mt-0.5">نشط</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-[#AF52DE]/10 flex items-center justify-center">
              <Layers className="h-3.5 w-3.5 text-[#AF52DE]" />
            </div>
          </div>
          <p className="text-2xl font-bold tabular-nums">{SECTION_ORDER.filter(t => getByType(t).length > 0).length}</p>
          <p className="text-[12px] text-[#86868b] dark:text-[#98989d] mt-0.5">نوع</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-[#FF9500]/10 flex items-center justify-center">
              <Clock className="h-3.5 w-3.5 text-[#FF9500]" />
            </div>
          </div>
          <p className="text-2xl font-bold tabular-nums">{soonExpiring.length}</p>
          <p className="text-[12px] text-[#86868b] dark:text-[#98989d] mt-0.5">تنتهي قريباً</p>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={() => router.push("/dashboard/accounts")}
          className="rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-4 text-right hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">الحسابات</span>
            <ChevronLeft className="h-4 w-4 text-[#86868b] dark:text-[#98989d]" />
          </div>
          <p className="text-[12px] text-[#86868b] dark:text-[#98989d] mt-1">{totalAccounts} حساب</p>
        </button>
        <button onClick={() => router.push("/dashboard/pricing")}
          className="rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-4 text-right hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">الأسعار</span>
            <ChevronLeft className="h-4 w-4 text-[#86868b] dark:text-[#98989d]" />
          </div>
          <p className="text-[12px] text-[#86868b] dark:text-[#98989d] mt-1">إدارة الاشتراكات</p>
        </button>
      </div>

      {/* Type Distribution - only if there are accounts */}
      {totalAccounts > 0 && (
        <div className="rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-[#86868b] dark:text-[#98989d]" />
            <h3 className="text-sm font-semibold">توزيع الأنواع</h3>
          </div>
          <div className="space-y-3">
            {SECTION_ORDER.map((type) => {
              const meta = TYPE_META[type]
              const count = getByType(type).length
              if (count === 0) return null
              const pct = Math.round((count / totalAccounts) * 100)
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium">{meta.label}</span>
                    <span className="text-[12px] text-[#86868b] dark:text-[#98989d] tabular-nums">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1 rounded-full bg-[#e5e5ea] dark:bg-[#2c2c2e] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Expiring Soon */}
      {soonExpiring.length > 0 && (
        <div className="rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-[#FF9500]" />
            <h3 className="text-sm font-semibold">على وشك الانتهاء</h3>
            <span className="text-xs text-[#86868b] dark:text-[#98989d] mr-auto">{soonExpiring.length}</span>
          </div>
          <div className="space-y-1">
            {soonExpiring.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#f2f2f7] dark:bg-[#2c2c2e]/50 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#FF9500] shrink-0" />
                  <span className="font-medium truncate">{a.server_name}</span>
                </div>
                <span className="text-xs text-[#86868b] dark:text-[#98989d] shrink-0 mr-2 tabular-nums">{a.expiry_date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
