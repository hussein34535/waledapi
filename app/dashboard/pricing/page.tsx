"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { ref, onValue } from "firebase/database"
import { useAuth } from "@/components/auth-provider"
import { database } from "@/lib/firebase"
import { DollarSign, Terminal, Wifi, Globe, AlertTriangle } from "lucide-react"

type AccountType = "SSH" | "VMESS" | "VLESS" | "SLOWDNS"

const TYPE_META: Record<string, { label: string; icon: any }> = {
  SSH: { label: "SSH", icon: Terminal },
  VMESS: { label: "VMess", icon: Wifi },
  VLESS: { label: "VLESS", icon: Wifi },
  SLOWDNS: { label: "SlowDNS", icon: Globe },
}

const SECTION_ORDER: AccountType[] = ["SSH", "VMESS", "VLESS", "SLOWDNS"]

const DEFAULT_PRICING = {
  SSH: { monthly: 15, quarterly: 40, yearly: 150 },
  VMESS: { monthly: 12, quarterly: 32, yearly: 120 },
  VLESS: { monthly: 12, quarterly: 32, yearly: 120 },
  SLOWDNS: { monthly: 18, quarterly: 48, yearly: 180 },
}

export default function PricingPage() {
  const { user } = useAuth()
  const [pricing, setPricing] = useState(DEFAULT_PRICING)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const pr = ref(database, "config/pricing")
    const unsub = onValue(pr, (snap) => {
      if (snap.exists()) setPricing(snap.val())
      setIsLoading(false)
    }, (err) => { setError(err.message); setIsLoading(false) })
    return () => unsub()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const idToken = await user?.getIdToken()
      await fetch("/api/pricing", {
        method: "PUT",
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(pricing),
      })
      setIsEditing(false)
    } catch { setError("فشل في حفظ الأسعار") }
    finally { setIsSaving(false) }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 pt-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight leading-[1.1]">أسعار الاشتراكات</h1>
          <p className="text-[#86868b] dark:text-[#98989d] text-[15px] mt-1">شهري / ربع سنوي / سنوي</p>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)}
            className="h-9 px-4 rounded-full bg-[#007AFF] text-white text-sm font-medium hover:bg-[#007AFF]/90 active:scale-[0.97] transition-all">
            تعديل
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-2xl bg-[#ff3b30]/5 border border-[#ff3b30]/10 p-6 mb-6 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-[#ff3b30] shrink-0" />
          <p className="text-sm text-[#ff3b30] flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-sm font-medium text-[#ff3b30] shrink-0">موافق</button>
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] animate-pulse" />
            ))}
          </div>
        ) : isEditing ? (
          <div className="p-5 space-y-5">
            {SECTION_ORDER.map((type) => {
              const meta = TYPE_META[type]
              return (
                <div key={type} className="rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <meta.icon className="h-4 w-4 text-[#86868b] dark:text-[#98989d]" />
                    <span className="text-sm font-semibold">{meta.label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(["monthly", "quarterly", "yearly"] as const).map((period) => (
                      <div key={period}>
                        <label className="text-[11px] text-[#86868b] dark:text-[#98989d] block mb-1">
                          {period === "monthly" ? "شهري" : period === "quarterly" ? "ربع سنوي" : "سنوي"}
                        </label>
                        <div className="relative">
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#86868b] dark:text-[#98989d]">$</span>
                          <input
                            type="number"
                            value={pricing[type]?.[period] || 0}
                            onChange={(e) => setPricing((prev) => ({
                              ...prev,
                              [type]: { ...prev[type], [period]: parseInt(e.target.value) || 0 }
                            }))}
                            className="w-full h-10 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#1c1c1e] pl-2 pr-7 text-sm tabular-nums"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setIsEditing(false)}
                className="flex-1 h-11 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-sm font-medium hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] transition-colors">
                إلغاء
              </button>
              <button onClick={handleSave} disabled={isSaving}
                className="flex-1 h-11 rounded-xl bg-[#007AFF] text-white text-sm font-medium hover:bg-[#007AFF]/90 active:scale-[0.97] transition-all">
                {isSaving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {/* Header */}
            <div className="flex items-center px-5 py-3 text-[11px] font-semibold text-[#86868b] dark:text-[#98989d]">
              <span className="flex-1">النوع</span>
              <span className="w-16 text-center">شهري</span>
              <span className="w-16 text-center">3 أشهر</span>
              <span className="w-16 text-center">سنوي</span>
            </div>
            {SECTION_ORDER.map((type) => {
              const meta = TYPE_META[type]
              const p = pricing[type]
              return (
                <div key={type} className="flex items-center px-5 py-3.5">
                  <div className="flex items-center gap-2 flex-1">
                    <meta.icon className="h-4 w-4 text-[#86868b] dark:text-[#98989d]" />
                    <span className="text-sm font-medium">{meta.label}</span>
                  </div>
                  <span className="w-16 text-center text-sm font-semibold tabular-nums">${p?.monthly || 0}</span>
                  <span className="w-16 text-center text-sm text-[#86868b] dark:text-[#98989d] tabular-nums">${p?.quarterly || 0}</span>
                  <span className="w-16 text-center text-sm text-[#86868b] dark:text-[#98989d] tabular-nums">${p?.yearly || 0}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
