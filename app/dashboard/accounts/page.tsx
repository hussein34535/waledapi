"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { ref, onValue } from "firebase/database"
import type { VpsAccount } from "@/lib/types"
import VpsAccountsList from "@/components/vps-accounts-list"
import { AddVpsAccountDialog } from "@/components/add-vps-account-dialog"
import { useAuth } from "@/components/auth-provider"
import { database } from "@/lib/firebase"
import { Plus, Terminal, Wifi, Globe, AlertTriangle } from "lucide-react"

type AccountType = "SSH" | "VMESS" | "VLESS" | "SLOWDNS"

const TYPE_META: Record<string, { label: string; icon: any }> = {
  SSH: { label: "SSH", icon: Terminal },
  VMESS: { label: "VMess", icon: Wifi },
  VLESS: { label: "VLESS", icon: Wifi },
  SLOWDNS: { label: "SlowDNS", icon: Globe },
}

const SECTION_ORDER: AccountType[] = ["SSH", "VMESS", "VLESS", "SLOWDNS"]

export default function AccountsPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<VpsAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newAccountId, setNewAccountId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<AccountType>("SSH")

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

  useEffect(() => {
    const available = SECTION_ORDER.find((t) => accounts.filter((a) => a.type === t).length > 0)
    if (available && !accounts.filter((a) => a.type === activeType).length) {
      setActiveType(available)
    }
  }, [accounts])

  const handleAccountAdded = (accountId: string) => {
    setNewAccountId(accountId)
    setTimeout(() => setNewAccountId(null), 5000)
  }

  const getByType = (type: AccountType) => accounts.filter((a) => a.type === type)

  return (
    <div className="max-w-2xl mx-auto px-5 pt-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight leading-[1.1]">الحسابات</h1>
          <p className="text-[#86868b] dark:text-[#98989d] text-[15px] mt-1">
            {accounts.length} حساب
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="h-[44px] w-[44px] rounded-full bg-[#007AFF] text-white flex items-center justify-center shadow-sm hover:shadow-md active:scale-90 transition-all"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-[#ff3b30]/5 border border-[#ff3b30]/10 p-6 mb-6 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-[#ff3b30] shrink-0" />
          <p className="text-sm text-[#ff3b30] flex-1">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-medium text-[#ff3b30] shrink-0">إعادة</button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-4">
              <div className="h-4 w-2/3 rounded bg-[#e5e5ea] dark:bg-[#2c2c2e] mb-3 animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-[#e5e5ea] dark:bg-[#2c2c2e] animate-pulse" />
            </div>
          ))}
        </div>
      ) : !error && (
        <>
          {accounts.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-10 text-center">
              <div className="h-16 w-16 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] flex items-center justify-center mx-auto mb-4">
                <Terminal className="h-8 w-8 text-[#86868b] dark:text-[#98989d]" />
              </div>
              <h2 className="text-lg font-bold mb-1">لا توجد حسابات</h2>
              <p className="text-sm text-[#86868b] dark:text-[#98989d] mb-6">أضف حساب SSH أو VMess أو VLESS أو SlowDNS</p>
              <button onClick={() => setIsAddOpen(true)}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#007AFF] text-white text-sm font-medium hover:bg-[#007AFF]/90 active:scale-[0.97] transition-all">
                <Plus className="h-4 w-4" />
                إضافة حساب
              </button>
            </div>
          ) : (
            <>
              {/* Type Tabs */}
              <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5 mb-6">
                {SECTION_ORDER.filter((t) => getByType(t).length > 0).map((type) => {
                  const meta = TYPE_META[type]
                  const count = getByType(type).length
                  const active = activeType === type
                  return (
                    <button
                      key={type}
                      onClick={() => setActiveType(type)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                        active
                          ? "bg-[#007AFF] text-white"
                          : "bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#3c3c43] dark:text-[#d1d1d6] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c]"
                      }`}
                    >
                      <meta.icon className="h-3.5 w-3.5" />
                      <span>{meta.label}</span>
                      <span className="text-[11px] opacity-70">{count}</span>
                    </button>
                  )
                })}
              </div>

              <VpsAccountsList accounts={getByType(activeType)} isLoading={false} newAccountId={newAccountId} />
            </>
          )}
        </>
      )}

      <AddVpsAccountDialog open={isAddOpen} onOpenChange={setIsAddOpen} userId={user?.uid} onAccountAdded={handleAccountAdded} />
    </div>
  )
}
