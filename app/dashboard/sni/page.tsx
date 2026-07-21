"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import type { SniConfig } from "@/lib/types"
import { AddSniDialog } from "@/components/add-sni-dialog"
import SniList from "@/components/sni-list"
import { useAuth } from "@/components/auth-provider"
import { Plus, Globe, AlertTriangle } from "lucide-react"

export default function SniPage() {
  const { user } = useAuth()
  const [sniList, setSniList] = useState<SniConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSniList = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const idToken = await user?.getIdToken()
      const response = await fetch("/api/sni", {
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
      })
      if (!response.ok) throw new Error()
      const data = await response.json()
      setSniList(data)
    } catch { setError("فشل في تحميل إعدادات SNI") }
    finally { setIsLoading(false) }
  }

  useEffect(() => { if (user) fetchSniList() }, [user])

  return (
    <div className="max-w-2xl mx-auto px-5 pt-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight leading-[1.1]">إعدادات SNI</h1>
          <p className="text-[#86868b] dark:text-[#98989d] text-[15px] mt-1">
            {sniList.length} مُعد
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="h-[44px] w-[44px] rounded-full bg-[#007AFF] text-white flex items-center justify-center shadow-sm hover:shadow-md active:scale-90 transition-all"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-[#ff3b30]/5 border border-[#ff3b30]/10 p-6 mb-6 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-[#ff3b30] shrink-0" />
          <p className="text-sm text-[#ff3b30] flex-1">{error}</p>
          <button onClick={fetchSniList} className="text-sm font-medium text-[#ff3b30] shrink-0">إعادة</button>
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] animate-pulse" />
            ))}
          </div>
        ) : sniList.length === 0 ? (
          <div className="text-center py-8">
            <div className="h-14 w-14 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] flex items-center justify-center mx-auto mb-3">
              <Globe className="h-7 w-7 text-[#86868b] dark:text-[#98989d]" />
            </div>
            <p className="text-sm text-[#86868b] dark:text-[#98989d] mb-4">لا توجد إعدادات SNI</p>
            <button onClick={() => setIsOpen(true)} className="text-sm font-medium text-[#007AFF] hover:underline">
              + إضافة SNI
            </button>
          </div>
        ) : (
          <SniList sniList={sniList} isLoading={false} onListChange={fetchSniList} />
        )}
      </div>

      <AddSniDialog open={isOpen} onOpenChange={setIsOpen} onSniAdded={fetchSniList} />
    </div>
  )
}
