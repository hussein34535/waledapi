"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { ref, onValue } from "firebase/database"
import type { VpsAccount } from "@/lib/types"
import type { SniConfig } from "@/lib/types"
import VpsAccountsList from "@/components/vps-accounts-list"
import { AddVpsAccountDialog } from "@/components/add-vps-account-dialog"
import { AddSniDialog } from "@/components/add-sni-dialog"
import SniList from "@/components/sni-list"
import { useAuth } from "@/components/auth-provider"
import { database } from "@/lib/firebase"
import { Plus, Server, Wifi, Terminal, Activity, Globe, FileText, AlertTriangle, BarChart3, TrendingUp, DollarSign } from "lucide-react"

type AccountType = "SSH" | "VMESS" | "VLESS" | "SLOWDNS"

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  SSH: { label: "SSH", icon: Terminal, color: "from-cyan-500/20 to-blue-500/10" },
  VMESS: { label: "VMess", icon: Wifi, color: "from-violet-500/20 to-purple-500/10" },
  VLESS: { label: "VLESS", icon: Wifi, color: "from-emerald-500/20 to-teal-500/10" },
  SLOWDNS: { label: "SlowDNS", icon: Globe, color: "from-amber-500/20 to-orange-500/10" },
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
  const [activeSection, setActiveSection] = useState<string>("SSH")
  const [analytics, setAnalytics] = useState<any>(null)
  const [isPricingOpen, setIsPricingOpen] = useState(false)
  const [pricing, setPricing] = useState(DEFAULT_PRICING)
  const [pricingLoading, setPricingLoading] = useState(true)
  const [savingPricing, setSavingPricing] = useState(false)

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
  const activeTypes = SECTION_ORDER.filter((t) => getByType(t).length > 0)
  const hasAccounts = totalAccounts > 0

  const handleSavePricing = async () => {
    setSavingPricing(true)
    try {
      const idToken = await user?.getIdToken()
      await fetch("/api/pricing", {
        method: "PUT",
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(pricing),
      })
      setIsPricingOpen(false)
    } catch {}
    finally { setSavingPricing(false) }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">لوحة التحكم</h1>
            <p className="text-muted-foreground text-sm mt-1">مرحباً بعودتك</p>
          </div>
          <button onClick={() => setIsAddOpen(true)}
            className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 active:scale-90 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30">
            <Plus className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl bg-card border border-border/50 p-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center"><Server className="h-4 w-4 text-primary" /></div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{totalAccounts}</p>
            <p className="text-xs text-muted-foreground mt-0.5">إجمالي الحسابات</p>
          </div>
          <div className="rounded-2xl bg-card border border-border/50 p-4 animate-scale-in stagger-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-success/10 flex items-center justify-center"><Activity className="h-4 w-4 text-success" /></div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{totalActive}</p>
            <p className="text-xs text-muted-foreground mt-0.5">نشط حالياً</p>
          </div>
          {analytics && (
            <>
              <div className="rounded-2xl bg-card border border-border/50 p-4 animate-scale-in stagger-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center"><Globe className="h-4 w-4 text-primary" /></div>
                </div>
                <p className="text-2xl font-bold tracking-tight">{analytics.sniCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">إعدادات SNI</p>
              </div>
              <div className="rounded-2xl bg-card border border-border/50 p-4 animate-scale-in stagger-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-xl bg-success/10 flex items-center justify-center"><Activity className="h-4 w-4 text-success" /></div>
                </div>
                <p className="text-2xl font-bold tracking-tight">{analytics.vpsActive}/{analytics.vpsCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">حسابات نشطة</p>
              </div>
            </>
          )}
        </div>

        {!isLoading && (
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none -mx-4 px-4">
            {hasAccounts && activeTypes.map((type, i) => {
              const meta = TYPE_META[type]
              const count = getByType(type).length
              return (
                <button key={type} onClick={() => setActiveSection(type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-300 active:scale-95 ${
                    activeSection === type ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
                  } animate-slide-up`} style={{ animationDelay: `${i * 50}ms` }}>
                  <meta.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{meta.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-md ${activeSection === type ? "bg-primary-foreground/15" : "bg-muted"}`}>{count}</span>
                </button>
              )
            })}
            <button onClick={() => setActiveSection("SNI")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-300 active:scale-95 ${
                activeSection === "SNI" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
              } animate-slide-up`}>
              <Globe className="h-4 w-4" />
              <span className="text-sm font-medium">SNI</span>
              {sniList.length > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-md ${activeSection === "SNI" ? "bg-primary-foreground/15" : "bg-muted"}`}>{sniList.length}</span>}
            </button>
            <button onClick={() => setActiveSection("STATS")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-300 active:scale-95 ${
                activeSection === "STATS" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
              } animate-slide-up`}>
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">إحصائيات</span>
            </button>
            <button onClick={() => setActiveSection("PRICING")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-300 active:scale-95 ${
                activeSection === "PRICING" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
              } animate-slide-up`}>
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">الأسعار</span>
            </button>
          </div>
        )}

        {error ? (
          <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-6 text-center">
            <p className="text-destructive text-sm">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20">إعادة المحاولة</button>
          </div>
        ) : (
          <>
            {hasAccounts || ["STATS", "PRICING"].includes(activeSection) ? (
              <div className="space-y-4">
                {activeSection === "STATS" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-card border border-border/50 p-4 animate-scale-in">
                      <div className="flex items-center gap-2 mb-2"><Globe className="h-4 w-4 text-primary" /></div>
                      <p className="text-2xl font-bold tracking-tight">{analytics?.sniCount || 0}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">إعدادات SNI</p>
                    </div>
                    <div className="rounded-2xl bg-card border border-border/50 p-4 animate-scale-in stagger-2">
                      <div className="flex items-center gap-2 mb-2"><Activity className="h-4 w-4 text-success" /></div>
                      <p className="text-2xl font-bold tracking-tight">{analytics?.vpsActive || 0}/{analytics?.vpsCount || 0}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">حسابات نشطة</p>
                    </div>
                  </div>
                ) : activeSection === "PRICING" ? (
                  <div className="rounded-2xl bg-card border border-border/50 p-5 animate-scale-in">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold">أسعار الاشتراك</h2>
                      <button onClick={() => setIsPricingOpen(true)}
                        className="text-sm text-primary font-medium hover:underline">تعديل</button>
                    </div>
                    {pricingLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 rounded-xl bg-muted animate-shimmer" />)}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {SECTION_ORDER.map((type) => {
                          const meta = TYPE_META[type]
                          const p = pricing[type]
                          return (
                            <div key={type} className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/30">
                              <div className="flex items-center gap-2">
                                <meta.icon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{meta.label}</span>
                              </div>
                              <div className="flex gap-3 text-xs text-muted-foreground">
                                <span>شهري ${p?.monthly || 0}</span>
                                <span>ربع سنوي ${p?.quarterly || 0}</span>
                                <span>سنوي ${p?.yearly || 0}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : activeSection === "SNI" ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">SNI Configuration</h2>
                      <button onClick={() => setIsSniOpen(true)} className="text-sm text-primary font-medium hover:underline">+ Add</button>
                    </div>
                    <SniList sniList={sniList} isLoading={isSniLoading} onListChange={fetchSniList} />
                  </div>
                ) : (
                  SECTION_ORDER.filter((t) => t === activeSection).map((type) => (
                    <div key={type}>
                      <VpsAccountsList accounts={getByType(type)} isLoading={isLoading} newAccountId={newAccountId} />
                    </div>
                  ))
                )}

                {hasAccounts && activeSection !== "SNI" && activeSection !== "STATS" && activeSection !== "PRICING" && (
                  <>
                    <div className="rounded-2xl bg-card border border-border/50 p-5 animate-scale-in">
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-semibold">توزيع الأنواع</h2>
                      </div>
                      <div className="space-y-3">
                        {SECTION_ORDER.map((type) => {
                          const meta = TYPE_META[type]
                          const count = getByType(type).length
                          const pct = totalAccounts ? Math.round((count / totalAccounts) * 100) : 0
                          return (
                            <div key={type}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <meta.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-xs font-medium">{meta.label}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{count} ({pct}%)</span>
                              </div>
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className={`h-full rounded-full bg-gradient-to-r ${meta.color.replace("/20", "").replace("/10", "")} transition-all duration-700`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {(() => {
                      const soon = accounts.filter(a => {
                        if (!a.expiry_date || a.status !== "active") return false
                        const diff = new Date(a.expiry_date).getTime() - Date.now()
                        return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000
                      })
                      if (soon.length === 0) return null
                      return (
                        <div className="rounded-2xl bg-card border border-border/50 p-5 animate-scale-in">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <h2 className="text-sm font-semibold">حسابات على وشك الانتهاء</h2>
                          </div>
                          <div className="space-y-2">
                            {soon.map(a => (
                              <div key={a.id} className="flex items-center justify-between text-sm py-1.5 px-3 rounded-xl bg-muted/30">
                                <span className="font-medium">{a.server_name}</span>
                                <span className="text-xs text-muted-foreground">{a.expiry_date}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}

                    <a href="/api-docs" className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                      <FileText className="h-4 w-4" />
                      API Documentation
                    </a>
                  </>
                )}
              </div>
            ) : (
              !isLoading && (
                <div className="rounded-3xl bg-card border border-border/50 p-8 text-center animate-scale-in">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4 animate-float">
                    <Server className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">لا توجد حسابات</h3>
                  <p className="text-sm text-muted-foreground mb-6">أضف حساب SSH أو VMess أو VLESS أو SlowDNS للبدء</p>
                  <button onClick={() => setIsAddOpen(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/25 active:scale-95 transition-all duration-200">
                    <Plus className="h-4 w-4" />
                    إضافة حساب
                  </button>
                </div>
              )
            )}

            {activeSection === "SNI" && !isSniLoading && sniList.length === 0 && (
              <div className="rounded-2xl bg-card border border-border/50 p-6 text-center">
                <p className="text-sm text-muted-foreground">لا توجد إعدادات SNI</p>
                <button onClick={() => setIsSniOpen(true)} className="mt-3 text-sm text-primary font-medium hover:underline">أضف الآن</button>
              </div>
            )}
          </>
        )}
      </div>

      <AddVpsAccountDialog open={isAddOpen} onOpenChange={setIsAddOpen} userId={user?.uid} onAccountAdded={handleAccountAdded} />
      <AddSniDialog open={isSniOpen} onOpenChange={setIsSniOpen} onSniAdded={fetchSniList} />

      {isPricingOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={() => setIsPricingOpen(false)}>
          <div className="w-full max-w-md rounded-3xl bg-card border border-border/50 p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">تعديل الأسعار</h2>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {SECTION_ORDER.map((type) => {
                const meta = TYPE_META[type]
                return (
                  <div key={type} className="rounded-xl bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <meta.icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">{meta.label}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(["monthly", "quarterly", "yearly"] as const).map((period) => (
                        <div key={period}>
                          <label className="text-[10px] text-muted-foreground block mb-1">
                            {period === "monthly" ? "شهري" : period === "quarterly" ? "ربع سنوي" : "سنوي"}
                          </label>
                          <input type="number" value={pricing[type]?.[period] || 0}
                            onChange={(e) => setPricing((prev) => ({ ...prev, [type]: { ...prev[type], [period]: parseInt(e.target.value) || 0 } }))}
                            className="w-full h-10 rounded-xl border border-border/60 bg-background/50 px-3 text-sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsPricingOpen(false)} className="flex-1 h-11 rounded-xl border border-border/60 text-sm font-medium">إلغاء</button>
              <button onClick={handleSavePricing} disabled={savingPricing}
                className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-md shadow-primary/20">
                {savingPricing ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
