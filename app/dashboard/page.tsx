"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { ref, onValue } from "firebase/database"
import type { VpsAccount, SniConfig } from "@/lib/types"
import VpsAccountsList from "@/components/vps-accounts-list"
import { AddVpsAccountDialog } from "@/components/add-vps-account-dialog"
import { AddSniDialog } from "@/components/add-sni-dialog"
import SniList from "@/components/sni-list"
import { useAuth } from "@/components/auth-provider"
import { database } from "@/lib/firebase"
import {
  Plus, Server, Wifi, Terminal, Globe, Activity, FileText,
  AlertTriangle, BarChart3, DollarSign, ChevronRight,
  Clock, Layers
} from "lucide-react"

type AccountType = "SSH" | "VMESS" | "VLESS" | "SLOWDNS"

const TYPE_META: Record<string, { label: string; icon: any; bar: string; dot: string; ring: string }> = {
  SSH: { label: "SSH", icon: Terminal, bar: "bg-cyan-500", dot: "bg-cyan-400", ring: "ring-cyan-400/20" },
  VMESS: { label: "VMess", icon: Wifi, bar: "bg-violet-500", dot: "bg-violet-400", ring: "ring-violet-400/20" },
  VLESS: { label: "VLESS", icon: Wifi, bar: "bg-emerald-500", dot: "bg-emerald-400", ring: "ring-emerald-400/20" },
  SLOWDNS: { label: "SlowDNS", icon: Globe, bar: "bg-amber-500", dot: "bg-amber-400", ring: "ring-amber-400/20" },
}

const SECTION_ORDER: AccountType[] = ["SSH", "VMESS", "VLESS", "SLOWDNS"]

const DEFAULT_PRICING = {
  SSH: { monthly: 15, quarterly: 40, yearly: 150 },
  VMESS: { monthly: 12, quarterly: 32, yearly: 120 },
  VLESS: { monthly: 12, quarterly: 32, yearly: 120 },
  SLOWDNS: { monthly: 18, quarterly: 48, yearly: 180 },
}

export default function Dashboard() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<VpsAccount[]>([])
  const [sniList, setSniList] = useState<SniConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSniLoading, setIsSniLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSniOpen, setIsSniOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newAccountId, setNewAccountId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<AccountType>("SSH")
  const [analytics, setAnalytics] = useState<any>(null)
  const [pricing, setPricing] = useState(DEFAULT_PRICING)
  const [pricingLoading, setPricingLoading] = useState(true)
  const [savingPricing, setSavingPricing] = useState(false)
  const [editingPricing, setEditingPricing] = useState(false)

  useEffect(() => {
    const pr = ref(database, "config/pricing")
    const unsub = onValue(pr, (snap) => {
      if (snap.exists()) setPricing(snap.val())
      setPricingLoading(false)
    })
    return () => unsub()
  }, [])

  const handleAccountAdded = (accountId: string) => {
    setNewAccountId(accountId)
    setTimeout(() => setNewAccountId(null), 5000)
  }

  const fetchSniList = async () => {
    setIsSniLoading(true)
    try {
      const idToken = await user?.getIdToken()
      const response = await fetch("/api/sni", {
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
      })
      if (!response.ok) throw new Error()
      const data = await response.json()
      setSniList(data)
    } catch { setSniList([]) }
    finally { setIsSniLoading(false) }
  }

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

  const fetchAnalytics = async () => {
    try {
      const idToken = await user?.getIdToken()
      const res = await fetch("/api/analytics/stats", {
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
      })
      if (res.ok) setAnalytics(await res.json())
    } catch {}
  }

  useEffect(() => { if (user) { fetchSniList(); fetchAnalytics() } }, [user])

  const getByType = (type: AccountType) => accounts.filter((a) => a.type === type)
  const totalActive = accounts.filter((a) => a.status === "active").length
  const totalAccounts = accounts.length

  const soonExpiring = accounts.filter(a => {
    if (!a.expiry_date || a.status !== "active") return false
    const diff = new Date(a.expiry_date).getTime() - Date.now()
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000
  })

  const handleSavePricing = async () => {
    setSavingPricing(true)
    try {
      const idToken = await user?.getIdToken()
      await fetch("/api/pricing", {
        method: "PUT",
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(pricing),
      })
      setEditingPricing(false)
    } catch {}
    finally { setSavingPricing(false) }
  }

  const metrics = [
    { label: "إجمالي الحسابات", value: totalAccounts, icon: Layers, accent: "from-blue-500 to-cyan-500" },
    { label: "نشط حالياً", value: totalActive, icon: Activity, accent: "from-emerald-500 to-green-500" },
    { label: "إعدادات SNI", value: analytics?.sniCount ?? sniList.length, icon: Globe, accent: "from-violet-500 to-purple-500" },
    { label: "على وشك الانتهاء", value: soonExpiring.length, icon: Clock, accent: "from-amber-500 to-orange-500" },
  ]

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="mx-auto max-w-2xl px-5 pt-8 pb-24">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-9">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">لوحة التحكم</h1>
            <p className="text-sm text-muted-foreground/70">إدارة حسابات VPN والسيرفرات</p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="relative h-[44px] w-[44px] rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-90 transition-all duration-200"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* ── Metrics Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-9">
          {metrics.map((m, i) => (
            <div
              key={m.label}
              className="relative rounded-2xl bg-card border border-border/40 overflow-hidden animate-scale-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${m.accent}`} />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${m.accent} flex items-center justify-center shadow-sm`}>
                    <m.icon className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
                <p className="text-xl font-bold tracking-tight tabular-nums">{m.value}</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">{m.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/25 p-5 mb-8 flex items-center gap-3 animate-scale-in">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive flex-1">{error}</p>
            <button onClick={() => window.location.reload()} className="text-sm font-medium text-destructive hover:underline shrink-0">
              إعادة
            </button>
          </div>
        )}

        {/* ── Empty State ── */}
        {!isLoading && !error && totalAccounts === 0 && (
          <div className="rounded-2xl bg-card border border-border/30 p-12 text-center mb-8 animate-scale-in">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mx-auto mb-5 ring-1 ring-primary/10">
              <Server className="h-9 w-9 text-primary/60" />
            </div>
            <h2 className="text-lg font-bold mb-1.5">لا توجد حسابات</h2>
            <p className="text-sm text-muted-foreground/70 mb-7">أضف حسابك الأول لإدارة السيرفرات والاشتراكات</p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.97] transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              إضافة حساب
            </button>
          </div>
        )}

        {/* ── Accounts Section ── */}
        {!isLoading && !error && totalAccounts > 0 && (
          <>
            {/* Type Pills */}
            <div className="mb-6">
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/70 border border-border/20" role="tablist">
                {SECTION_ORDER.filter((t) => getByType(t).length > 0).map((type) => {
                  const meta = TYPE_META[type]
                  const count = getByType(type).length
                  const active = activeType === type
                  return (
                    <button
                      key={type}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveType(type)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        active
                          ? "bg-card text-foreground shadow-sm ring-1 ring-border/50"
                          : "text-muted-foreground/60 hover:text-foreground/80"
                      }`}
                    >
                      <meta.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{meta.label}</span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium ${
                        active ? `${meta.bar}/10 text-foreground/80` : "bg-muted-foreground/10 text-muted-foreground/50"
                      }`}>{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Account List */}
            <div className="mb-9">
              <VpsAccountsList accounts={getByType(activeType)} isLoading={isLoading} newAccountId={newAccountId} />
            </div>
          </>
        )}

        {/* ── Tools & Settings ── */}
        {!isLoading && !error && (
          <div className="space-y-5 animate-slide-up" style={{ animationDelay: "80ms" }}>
            <div className="flex items-center gap-2">
              <div className="h-[1px] flex-1 bg-border/30" />
              <span className="text-[11px] font-semibold text-muted-foreground/50 tracking-widest uppercase px-2">الأدوات</span>
              <div className="h-[1px] flex-1 bg-border/30" />
            </div>

            {/* Type Distribution */}
            {totalAccounts > 0 && (
              <div className="rounded-2xl bg-card border border-border/30 p-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">توزيع الأنواع</p>
                      <p className="text-[11px] text-muted-foreground/60">إجمالي {totalAccounts} حساب</p>
                    </div>
                  </div>
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
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${meta.dot}`} />
                            <span className="text-xs font-medium">{meta.label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground/60 tabular-nums">{count} <span className="text-[10px]">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted/70 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${meta.bar} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* SNI */}
            <div className="rounded-2xl bg-card border border-border/30 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">إعدادات SNI</p>
                    <p className="text-[11px] text-muted-foreground/60">{sniList.length} مُعد</p>
                  </div>
                </div>
                <button onClick={() => setIsSniOpen(true)}
                  className="h-8 px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                  + إضافة
                </button>
              </div>
              <SniList sniList={sniList} isLoading={isSniLoading} onListChange={fetchSniList} />
            </div>

            {/* Expiring */}
            {soonExpiring.length > 0 && (
              <div className="rounded-2xl bg-card border border-amber-500/20 p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-400/90">حسابات على وشك الانتهاء</p>
                    <p className="text-[11px] text-amber-500/50">{soonExpiring.length} حسابات</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {soonExpiring.map(a => (
                    <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/50 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                        <span className="font-medium truncate text-foreground/80">{a.server_name || a.id}</span>
                      </div>
                      <span className="text-xs text-muted-foreground/60 shrink-0 mr-3 tabular-nums">{a.expiry_date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing */}
            <div className="rounded-2xl bg-card border border-border/30 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">أسعار الاشتراكات</p>
                    <p className="text-[11px] text-muted-foreground/60">شهري / ربع سنوي / سنوي</p>
                  </div>
                </div>
                {!editingPricing && (
                  <button onClick={() => setEditingPricing(true)}
                    className="h-8 px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                    تعديل
                  </button>
                )}
              </div>

              {pricingLoading ? (
                <div className="space-y-2">
                  {SECTION_ORDER.map((t) => (
                    <div key={t} className="h-11 rounded-xl bg-muted/50 animate-shimmer" />
                  ))}
                </div>
              ) : editingPricing ? (
                <div className="space-y-4">
                  {SECTION_ORDER.map((type) => {
                    const meta = TYPE_META[type]
                    return (
                      <div key={type} className="rounded-xl bg-muted/30 p-3.5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`h-2 w-2 rounded-full ${meta.dot}`} />
                          <span className="text-xs font-semibold">{meta.label}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {(["monthly", "quarterly", "yearly"] as const).map((period) => (
                            <div key={period}>
                              <label className="text-[10px] text-muted-foreground/60 block mb-1">
                                {period === "monthly" ? "شهري" : period === "quarterly" ? "ربع سنوي" : "سنوي"}
                              </label>
                              <div className="relative">
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/50">$</span>
                                <input
                                  type="number"
                                  value={pricing[type]?.[period] || 0}
                                  onChange={(e) => setPricing((prev) => ({
                                    ...prev,
                                    [type]: { ...prev[type], [period]: parseInt(e.target.value) || 0 }
                                  }))}
                                  className="w-full h-9 rounded-lg border border-border/40 bg-background/50 pl-2.5 pr-6 text-xs tabular-nums"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex gap-2 pt-1.5">
                    <button onClick={() => { setEditingPricing(false); setPricing(pricing) }}
                      className="flex-1 h-10 rounded-xl border border-border/40 text-sm font-medium hover:bg-muted/30 transition-colors">
                      إلغاء
                    </button>
                    <button onClick={handleSavePricing} disabled={savingPricing}
                      className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25 transition-all active:scale-[0.97]">
                      {savingPricing ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {SECTION_ORDER.map((type) => {
                    const meta = TYPE_META[type]
                    const p = pricing[type]
                    return (
                      <div key={type} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-2 w-2 rounded-full ${meta.dot}`} />
                          <span className="text-sm font-medium">{meta.label}</span>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground/70 tabular-nums" dir="ltr">
                          <span className="text-foreground/80 font-medium">${p?.monthly || 0}<span className="text-muted-foreground/50 font-normal">/شهر</span></span>
                          <span className="text-muted-foreground/50">${p?.quarterly || 0}<span className="text-muted-foreground/40">/3ش</span></span>
                          <span className="text-muted-foreground/50">${p?.yearly || 0}<span className="text-muted-foreground/40">/سنة</span></span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* API Docs */}
            <a href="/api-docs"
              className="flex items-center justify-between py-4 px-5 rounded-2xl bg-card border border-border/30 group hover:border-primary/30 transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-muted/80 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">توثيق API</p>
                  <p className="text-[11px] text-muted-foreground/50">عرض الوثائق وال endpoints</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
            </a>
          </div>
        )}
      </div>

      <AddVpsAccountDialog open={isAddOpen} onOpenChange={setIsAddOpen} userId={user?.uid} onAccountAdded={handleAccountAdded} />
      <AddSniDialog open={isSniOpen} onOpenChange={setIsSniOpen} onSniAdded={fetchSniList} />
    </div>
  )
}
