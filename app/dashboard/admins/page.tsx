"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, doc, deleteDoc, setDoc } from "firebase/firestore"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase"
import { Shield, ShieldCheck, Trash2, AlertTriangle, Sun, Moon, UserPlus, Crown, X } from "lucide-react"
import { useTheme } from "next-themes"

interface AdminRecord {
  uid: string
  email?: string
  addedAt?: string
}

export default function AdminsPage() {
  const { setTheme, resolvedTheme } = useTheme()
  const { user } = useAuth()
  const [admins, setAdmins] = useState<AdminRecord[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newUid, setNewUid] = useState("")

  useEffect(() => {
    if (!user) return

    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "admins"))
        const list: AdminRecord[] = snap.docs.map(d => ({
          uid: d.id,
          ...d.data(),
        }))
        setAdmins(list)
        setIsAdmin(list.some(a => a.uid === user.uid))
      } catch {
        setError("فشل في تحميل المشرفين")
      }
      finally { setIsLoading(false) }
    }
    load()
  }, [user])

  const handleRemove = async (uid: string) => {
    if (uid === user?.uid) return
    try {
      await deleteDoc(doc(db, "admins", uid))
      setAdmins(prev => prev.filter(a => a.uid !== uid))
    } catch {
      setError("فشل في إزالة المشرف")
    }
  }

  const handleAdd = async () => {
    if (!newUid.trim()) return
    try {
      await setDoc(doc(db, "admins", newUid.trim()), {
        email: newUid.trim(),
        addedAt: new Date().toISOString(),
        addedBy: user?.email || user?.uid,
      })
      setAdmins(prev => [...prev, { uid: newUid.trim(), email: newUid.trim(), addedAt: new Date().toISOString() }])
      setNewUid("")
      setShowAdd(false)
    } catch {
      setError("فشل في إضافة المشرف")
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-10 text-center">
          <div className="h-8 w-8 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-10 text-center">
          <Shield className="h-10 w-10 text-[#86868b] dark:text-[#98989d] mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-1">غير مصرح</h2>
          <p className="text-sm text-[#86868b] dark:text-[#98989d]">ليس لديك صلاحية الوصول لهذه الصفحة</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">المشرفين</h1>
          <p className="text-[13px] text-[#86868b] dark:text-[#98989d] mt-0.5">{admins.length} مشرف</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAdd(!showAdd)}
            className="h-8 w-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors">
            <UserPlus className="h-4 w-4 text-[#007AFF]" />
          </button>
          <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="h-8 w-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors">
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4 text-[#8e8e93]" /> : <Moon className="h-4 w-4 text-[#8e8e93]" />}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-4 mb-4">
          <div className="flex gap-2">
            <input type="text" placeholder="البريد الإلكتروني للمشرف الجديد"
              value={newUid} onChange={(e) => setNewUid(e.target.value)}
              className="flex-1 h-10 rounded-xl bg-[#e5e5ea] dark:bg-[#2c2c2e] border-0 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30" />
            <button onClick={handleAdd}
              className="h-10 px-4 rounded-xl bg-[#007AFF] text-white text-sm font-medium hover:bg-[#007AFF]/90 transition-colors">
              إضافة
            </button>
            <button onClick={() => { setShowAdd(false); setNewUid("") }}
              className="h-10 w-10 rounded-xl bg-[#e5e5ea] dark:bg-[#2c2c2e] flex items-center justify-center hover:bg-[#d1d1d6] dark:hover:bg-[#3a3a3c] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-[#ff3b30]/5 border border-[#ff3b30]/10 p-4 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#ff3b30] shrink-0" />
          <p className="text-sm text-[#ff3b30] flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-sm font-medium text-[#ff3b30] shrink-0">موافق</button>
        </div>
      )}

      <div className="rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 overflow-hidden">
        {admins.length === 0 ? (
          <div className="p-10 text-center">
            <Shield className="h-10 w-10 text-[#86868b] dark:text-[#98989d] mx-auto mb-3" />
            <p className="text-sm text-[#86868b] dark:text-[#98989d]">لا يوجد مشرفين</p>
          </div>
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {admins.map(a => {
              const isMe = a.uid === user?.uid
              return (
                <div key={a.uid} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="h-10 w-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center shrink-0">
                    {isMe ? <ShieldCheck className="h-5 w-5 text-[#007AFF]" /> : <Shield className="h-5 w-5 text-[#34C759]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">{a.email || a.uid}</span>
                      {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] font-medium shrink-0">أنت</span>}
                    </div>
                    {a.addedAt && (
                      <p className="text-[12px] text-[#86868b] dark:text-[#98989d]">
                        أضيف {new Date(a.addedAt).toLocaleDateString("ar-EG")}
                      </p>
                    )}
                  </div>
                  {!isMe && (
                    <button onClick={() => handleRemove(a.uid)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-[#86868b] dark:text-[#98989d] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30] transition-colors"
                      title="إزالة المشرف">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl bg-[#007AFF]/5 border border-[#007AFF]/10 p-4">
        <p className="text-[12px] text-[#86868b] dark:text-[#98989d] leading-relaxed">
          أول زائر لصفحة المستخدمين يصبح مشرف تلقائياً. من هنا تقدر تضيف أو تزيل مشرفين يدوياً.
        </p>
      </div>
    </div>
  )
}
