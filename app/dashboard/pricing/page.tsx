"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { ref, onValue, set } from "firebase/database"
import { useAuth } from "@/components/auth-provider"
import { database } from "@/lib/firebase"
import { AlertTriangle, Sun, Moon, DollarSign } from "lucide-react"
import { useTheme } from "next-themes"

export default function PricingPage() {
  const { setTheme, resolvedTheme } = useTheme()
  const { user } = useAuth()
  const [yearlyPrice, setYearlyPrice] = useState(50)
  const [currency, setCurrency] = useState("ج.م")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const pr = ref(database, "config/pricing/subscription")
    const unsub = onValue(pr, (snap) => {
      if (snap.exists()) {
        const v = snap.val()
        setYearlyPrice(v.yearly_price ?? 50)
        setCurrency(v.currency ?? "ج.م")
      }
      setIsLoading(false)
    }, (err) => { setError(err.message); setIsLoading(false) })
    return () => unsub()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await set(ref(database, "config/pricing/subscription"), {
        yearly_price: yearlyPrice,
        currency: currency,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch { setError("فشل في الحفظ") }
    finally { setIsSaving(false) }
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">سعر الاشتراك</h1>
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="h-8 w-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors"
        >
          {resolvedTheme === "dark" ? <Sun className="h-4 w-4 text-[#8e8e93]" /> : <Moon className="h-4 w-4 text-[#8e8e93]" />}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-[#ff3b30]/5 border border-[#ff3b30]/10 p-4 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#ff3b30] shrink-0" />
          <p className="text-sm text-[#ff3b30] flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-sm font-medium text-[#ff3b30] shrink-0">موافق</button>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-8">
          <div className="h-6 w-24 rounded bg-[#f2f2f7] dark:bg-[#2c2c2e] animate-pulse mb-4" />
          <div className="h-12 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] animate-pulse" />
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-6 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-7 w-7 text-[#007AFF]" />
          </div>
          <h2 className="text-sm font-semibold mb-1">اشتراك التطبيق</h2>
          <p className="text-[13px] text-[#86868b] dark:text-[#98989d] mb-5">باقة سنوية — إزالة الإعلانات</p>

          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-28">
              <input type="number" value={yearlyPrice}
                onChange={(e) => setYearlyPrice(parseInt(e.target.value) || 0)}
                className="w-full h-12 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border-0 text-center text-2xl font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30" />
            </div>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="h-12 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border-0 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30">
              <option value="ج.م">ج.م</option>
              <option value="$">$</option>
              <option value="ر.س">ر.س</option>
              <option value="د.ك">د.ك</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={isSaving}
              className={`flex-1 h-11 rounded-xl font-medium text-sm transition-all ${
                success
                  ? "bg-[#34C759] text-white"
                  : "bg-[#007AFF] text-white hover:bg-[#007AFF]/90 active:scale-[0.97]"
              }`}>
              {isSaving ? "جاري الحفظ..." : success ? "✓ تم الحفظ" : "حفظ"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
