"use client"

import { useEffect, useState, useRef } from "react"
import { ref, onValue } from "firebase/database"
import type { VpsAccount } from "@/lib/types"
import type { SniConfig } from "@/lib/types"
import VpsAccountsList from "@/components/vps-accounts-list"
import { AddVpsAccountDialog } from "@/components/add-vps-account-dialog"
import { AddSniDialog } from "@/components/add-sni-dialog"
import SniList from "@/components/sni-list"
import { useAuth } from "@/components/auth-provider"
import { database } from "@/lib/firebase"
import { Plus, Server, Wifi, Terminal, Shield, Activity, Search } from "lucide-react"

type AccountType = "SSH" | "VMESS" | "VLESS" | "TROJAN" | "SOCKS" | "SHADOWSOCKS" | "MS"

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  SSH: { label: "SSH", icon: Terminal, color: "from-cyan-500/20 to-blue-500/10" },
  VMESS: { label: "VMess", icon: Wifi, color: "from-violet-500/20 to-purple-500/10" },
  VLESS: { label: "VLESS", icon: Wifi, color: "from-emerald-500/20 to-teal-500/10" },
  TROJAN: { label: "Trojan", icon: Shield, color: "from-rose-500/20 to-pink-500/10" },
  SOCKS: { label: "SOCKS", icon: Server, color: "from-amber-500/20 to-orange-500/10" },
  SHADOWSOCKS: { label: "Shadowsocks", icon: Shield, color: "from-indigo-500/20 to-blue-500/10" },
  MS: { label: "MS", icon: Server, color: "from-slate-500/20 to-gray-500/10" },
}

const SECTION_ORDER: AccountType[] = ["SSH", "VMESS", "VLESS", "TROJAN", "SOCKS", "SHADOWSOCKS", "MS"]

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
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

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
    } catch {
      setSniList([])
    } finally {
      setIsSniLoading(false)
    }
  }

  useEffect(() => {
    const accountsRef = ref(database, "vpsAccounts")
    const unsub = onValue(
      accountsRef,
      (snapshot) => {
        const data: VpsAccount[] = []
        if (snapshot.exists()) {
          snapshot.forEach((child) => { data.push({ id: child.key, ...child.val() }) })
          data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        }
        setAccounts(data)
        setIsLoading(false)
      },
      (err) => {
        setError(err.message)
        setIsLoading(false)
      }
    )
    fetchSniList()
    return () => unsub()
  }, [])

  const getByType = (type: AccountType) => accounts.filter((a) => a.type === type)
  const totalActive = accounts.filter((a) => a.status === "active").length
  const totalAccounts = accounts.length

  const activeTypes = SECTION_ORDER.filter((t) => getByType(t).length > 0)
  const hasAccounts = totalAccounts > 0

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">لوحة التحكم</h1>
            <p className="text-muted-foreground text-sm mt-1">مرحباً بعودتك</p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 active:scale-90 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="rounded-2xl bg-card border border-border/50 p-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Server className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{totalAccounts}</p>
            <p className="text-xs text-muted-foreground mt-0.5">إجمالي الحسابات</p>
          </div>
          <div className="rounded-2xl bg-card border border-border/50 p-4 animate-scale-in stagger-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-success/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{totalActive}</p>
            <p className="text-xs text-muted-foreground mt-0.5">نشط حالياً</p>
          </div>
        </div>

        {!isLoading && hasAccounts && (
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none -mx-4 px-4">
            {activeTypes.map((type, i) => {
              const meta = TYPE_META[type]
              const count = getByType(type).length
              return (
                <button
                  key={type}
                  onClick={() => setActiveSection(type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-300 active:scale-95 ${
                    activeSection === type
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
                  } animate-slide-up`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <meta.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{meta.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                    activeSection === type ? "bg-primary-foreground/15" : "bg-muted"
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {error ? (
          <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-6 text-center">
            <p className="text-destructive text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <>
            {hasAccounts ? (
              <div className="space-y-4">
                {activeSection === "SNI" ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">SNI Configuration</h2>
                      <button
                        onClick={() => setIsSniOpen(true)}
                        className="text-sm text-primary font-medium hover:underline"
                      >
                        + Add
                      </button>
                    </div>
                    <SniList sniList={sniList} isLoading={isSniLoading} onListChange={fetchSniList} />
                  </div>
                ) : (
                  <>
                    {SECTION_ORDER.filter((t) => t === activeSection).map((type) => {
                      const typeAccounts = getByType(type)
                      return (
                        <div key={type}>
                          <VpsAccountsList
                            accounts={typeAccounts}
                            isLoading={isLoading}
                            newAccountId={newAccountId}
                          />
                        </div>
                      )
                    })}
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
                  <p className="text-sm text-muted-foreground mb-6">أضف حساب SSH أو VMess أو VLESS للبدء</p>
                  <button
                    onClick={() => setIsAddOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/25 active:scale-95 transition-all duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    إضافة حساب
                  </button>
                </div>
              )
            )}

            {activeSection === "SNI" && !isSniLoading && sniList.length === 0 && (
              <div className="rounded-2xl bg-card border border-border/50 p-6 text-center">
                <p className="text-sm text-muted-foreground">لا توجد إعدادات SNI</p>
                <button
                  onClick={() => setIsSniOpen(true)}
                  className="mt-3 text-sm text-primary font-medium hover:underline"
                >
                  أضف الآن
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AddVpsAccountDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        userId={user?.uid}
        onAccountAdded={handleAccountAdded}
      />
      <AddSniDialog open={isSniOpen} onOpenChange={setIsSniOpen} onSniAdded={fetchSniList} />
    </div>
  )
}
