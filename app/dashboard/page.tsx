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
import { Plus, Server, Wifi, Terminal, Globe, Activity, FileText, AlertTriangle, BarChart3, DollarSign, ChevronRight } from "lucide-react"

type AccountType = "SSH" | "VMESS" | "VLESS" | "SLOWDNS"

const TYPE_META: Record<string, { label: string; icon: any; gradient: string; glow: string }> = {
  SSH: { label: "SSH", icon: Terminal, gradient: "from-cyan-500 to-blue-500", glow: "shadow-cyan-500/20" },
  VMESS: { label: "VMess", icon: Wifi, gradient: "from-violet-500 to-purple-500", glow: "shadow-violet-500/20" },
  VLESS: { label: "VLESS", icon: Wifi, gradient: "from-emerald-500 to-teal-500", glow: "shadow-emerald-500/20" },
  SLOWDNS: { label: "SlowDNS", icon: Globe, gradient: "from-amber-500 to-orange-500", glow: "shadow-amber-500/20" },
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

  const statCards = [
    { label: "إجمالي الحسابات", value: totalAccounts, icon: Server, color: "text-primary", bg: "bg-primary/10", delay: "stagger-1" },
    { label: "نشط حالياً", value: totalActive, icon: Activity, color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success))/0.1]", delay: "stagger-2" },
    { label: "SNI", value: analytics?.sniCount ?? sniList.length, icon: Globe, color: "text-sky-500", bg: "bg-sky-500/10", delay: "stagger-3" },
    ...(soonExpiring.length > 0 ? [{ label: "على وشك الانتهاء", value: soonExpiring.length, icon: AlertTriangle, color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning))/0.1]", delay: "stagger-4" }] : [])
  ]

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="mx-auto max-w-2xl px-4 pt-6 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-slide-up">
          <div>
            <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-balance">لوحة التحكم</h1>
            <p className="text-muted-foreground text-sm mt-0.5">إدارة الحسابات والإعدادات</p>
          </div>
          <button onClick={() => setIsAddOpen(true)}
            className="h-11 w-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/20 active:scale-90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className={`rounded-2xl bg-card border border-border/40 p-4 animate-scale-in ${stat.delay}`}>
              <div className={`h-8 w-8 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold tracking-tight tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-6 text-center mb-6 animate-scale-in">
            <p className="text-destructive text-sm mb-3">{error}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors">
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && totalAccounts === 0 && (
          <div className="rounded-2xl bg-card border border-border/40 p-10 text-center mb-6 animate-scale-in">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
              <Server className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">لا توجد حسابات</h3>
            <p className="text-sm text-muted-foreground mb-6">أضف حسابك الأول للبدء في إدارة السيرفرات</p>
            <button onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-md shadow-primary/20 active:scale-95 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25">
              <Plus className="h-4 w-4" />
              إضافة حساب
            </button>
          </div>
        )}

        {/* Account Section */}
        {!isLoading && !error && totalAccounts > 0 && (
          <>
            {/* Type Tabs */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">الحسابات</h2>
              <div className="flex gap-1.5 p-1 rounded-2xl bg-muted/60" role="tablist">
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
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        active
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <meta.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{meta.label}</span>
                      <span className={`text-xs px-1.5 py-px rounded-md font-medium ${
                        active ? "bg-muted/80" : "bg-muted/40"
                      }`}>{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Account List */}
            <div className="mb-8">
              <VpsAccountsList accounts={getByType(activeType)} isLoading={isLoading} newAccountId={newAccountId} />
            </div>
          </>
        )}

        {/* Tools Section */}
        {!isLoading && !error && (
          <div className="space-y-4 animate-slide-up" style={{ animationDelay: "120ms" }}>
            <h2 className="text-sm font-semibold text-muted-foreground px-1">الأدوات والإعدادات</h2>

            <div className="grid gap-3">
              {/* Type Distribution - always visible when there are accounts */}
              {totalAccounts > 0 && (
                <div className="rounded-2xl bg-card border border-border/40 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-4 w-4 text-primary" />
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
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${meta.gradient}`} />
                              <span className="text-xs font-medium">{meta.label}</span>
                            </div>
                            <span className="text-xs text-muted-foreground tabular-nums">{count} <span className="text-[10px]">({pct}%)</span></span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${meta.gradient} transition-all duration-700`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* SNI Management */}
              <div className="rounded-2xl bg-card border border-border/40 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-sky-500" />
                    <h3 className="text-sm font-semibold">إعدادات SNI</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground tabular-nums">{sniList.length} مُعد</span>
                    <button onClick={() => setIsSniOpen(true)}
                      className="text-xs text-primary font-medium hover:underline">
                      + إضافة
                    </button>
                  </div>
                </div>
                <SniList sniList={sniList} isLoading={isSniLoading} onListChange={fetchSniList} />
              </div>

              {/* Expiring Soon */}
              {soonExpiring.length > 0 && (
                <div className="rounded-2xl bg-card border border-border/40 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
                    <h3 className="text-sm font-semibold">تنتهي قريباً</h3>
                    <span className="text-xs text-muted-foreground mr-auto">{soonExpiring.length} حسابات</span>
                  </div>
                  <div className="space-y-2">
                    {soonExpiring.map(a => (
                      <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/30 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`h-1.5 w-1.5 rounded-full bg-[hsl(var(--warning))] shrink-0`} />
                          <span className="font-medium truncate">{a.server_name || a.id}</span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 mr-3">{a.expiry_date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="rounded-2xl bg-card border border-border/40 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <h3 className="text-sm font-semibold">أسعار الاشتراكات</h3>
                  </div>
                  {!editingPricing && (
                    <button onClick={() => setEditingPricing(true)}
                      className="text-xs text-primary font-medium hover:underline">
                      تعديل
                    </button>
                  )}
                </div>

                {pricingLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-10 rounded-xl bg-muted animate-shimmer" />
                    ))}
                  </div>
                ) : editingPricing ? (
                  <div className="space-y-4">
                    {SECTION_ORDER.map((type) => {
                      const meta = TYPE_META[type]
                      return (
                        <div key={type} className="rounded-xl bg-muted/30 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${meta.gradient}`} />
                            <span className="text-xs font-semibold">{meta.label}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {(["monthly", "quarterly", "yearly"] as const).map((period) => (
                              <div key={period}>
                                <label className="text-[10px] text-muted-foreground block mb-1">
                                  {period === "monthly" ? "شهري" : period === "quarterly" ? "ربع سنوي" : "سنوي"}
                                </label>
                                <div className="relative">
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                                  <input
                                    type="number"
                                    value={pricing[type]?.[period] || 0}
                                    onChange={(e) => setPricing((prev) => ({
                                      ...prev,
                                      [type]: { ...prev[type], [period]: parseInt(e.target.value) || 0 }
                                    }))}
                                    className="w-full h-9 rounded-lg border border-border/60 bg-background pl-3 pr-6 text-sm tabular-nums"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => { setEditingPricing(false); setPricing(pricing) }}
                        className="flex-1 h-10 rounded-xl border border-border/60 text-sm font-medium hover:bg-muted/50 transition-colors">
                        إلغاء
                      </button>
                      <button onClick={handleSavePricing} disabled={savingPricing}
                        className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25 transition-all active:scale-[0.97]">
                        {savingPricing ? "جاري الحفظ..." : "حفظ التغييرات"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {SECTION_ORDER.map((type) => {
                      const meta = TYPE_META[type]
                      const p = pricing[type]
                      return (
                        <div key={type} className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/30">
                          <div className="flex items-center gap-2">
                            <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${meta.gradient}`} />
                            <span className="text-sm font-medium">{meta.label}</span>
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground tabular-nums" dir="ltr">
                            <span>${p?.monthly || 0}/m</span>
                            <span>${p?.quarterly || 0}/q</span>
                            <span>${p?.yearly || 0}/y</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* API Docs Link */}
              <a href="/api-docs"
                className="flex items-center justify-between py-3.5 px-5 rounded-2xl bg-card border border-border/40 group hover:border-primary/30 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center">
                    <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-sm font-medium">توثيق API</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            </div>
          </div>
        )}
      </div>

      <AddVpsAccountDialog open={isAddOpen} onOpenChange={setIsAddOpen} userId={user?.uid} onAccountAdded={handleAccountAdded} />
      <AddSniDialog open={isSniOpen} onOpenChange={setIsSniOpen} onSniAdded={fetchSniList} />
    </div>
  )
}
