"use client"

import { useEffect, useState } from "react"
import { collection, query, getDocs, doc, setDoc, orderBy } from "firebase/firestore"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase"
import { Search, Shield, Ban, UserCheck, AlertTriangle, Crown, Users, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"

interface UserRecord {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  isPremium: boolean
  isBanned: boolean
  premiumActivatedAt: string | null
  premiumActivatedBy: string | null
}

const ADMIN_EMAILS = ["darkshadowdx3@gmail.com", "waledpro.f@gmail.com"]

export default function UsersPage() {
  const { setTheme, resolvedTheme } = useTheme()
  const { user } = useAuth()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!user) return

    const checkAndLoad = async () => {
      try {
        const admin = ADMIN_EMAILS.includes(user.email || "")
        if (!admin) {
          const adminsSnap = await getDocs(collection(db, "admins"))
          if (!adminsSnap.docs.some(d => d.id === user.uid)) {
            setIsAdmin(false)
            setIsChecking(false)
            return
          }
        }
        setIsAdmin(true)

        const q = query(collection(db, "users"), orderBy("email"))
        const snap = await getDocs(q)
        const list: UserRecord[] = snap.docs.map(d => {
          const data = d.data()
          return {
            uid: d.id,
            email: data.email || null,
            displayName: data.displayName || null,
            photoURL: data.photoURL || null,
            isPremium: data.isPremium === true,
            isBanned: data.isBanned === true,
            premiumActivatedAt: data.premiumActivatedAt || null,
            premiumActivatedBy: data.premiumActivatedBy || null,
          }
        })
        setUsers(list)
      } catch {
        setError("فشل في تحميل المستخدمين")
      }
      finally { setIsChecking(false); setIsLoading(false) }
    }

    checkAndLoad()
  }, [user])

  const handleTogglePremium = async (uid: string, current: boolean) => {
    try {
      const update: Record<string, any> = { isPremium: !current }
      if (!current) {
        update.premiumActivatedAt = new Date().toISOString()
        update.premiumActivatedBy = user?.email || user?.uid
      }
      await setDoc(doc(db, "users", uid), update, { merge: true })
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, isPremium: !current } : u))
    } catch { setError("فشل في تحديث البريميوم") }
  }

  const handleToggleBan = async (uid: string, current: boolean) => {
    try {
      await setDoc(doc(db, "users", uid), { isBanned: !current }, { merge: true })
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, isBanned: !current } : u))
    } catch { setError("فشل في تحديث الحظر") }
  }

  const filtered = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return (u.email?.toLowerCase().includes(q)) || (u.displayName?.toLowerCase().includes(q))
  })

  const avatarInitial = (u: UserRecord) => {
    if (u.displayName) return u.displayName.charAt(0).toUpperCase()
    if (u.email) return u.email.charAt(0).toUpperCase()
    return "?"
  }

  if (isChecking) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-8 flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" />
          <p className="text-sm text-[#86868b] dark:text-[#98989d]">جاري التحقق...</p>
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
        <h1 className="text-xl font-bold">المستخدمين</h1>
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

      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b] dark:text-[#98989d]" />
        <input
          type="text"
          placeholder="بحث بالبريد أو الاسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 rounded-xl bg-[#e5e5ea] dark:bg-[#2c2c2e] border-0 pr-9 pl-4 text-sm placeholder:text-[#86868b] dark:placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#e5e5ea] dark:bg-[#2c2c2e] animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-1/3 rounded bg-[#e5e5ea] dark:bg-[#2c2c2e] animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-[#e5e5ea] dark:bg-[#2c2c2e] animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-10 text-center">
          <Users className="h-10 w-10 text-[#86868b] dark:text-[#98989d] mx-auto mb-3" />
          <p className="text-sm text-[#86868b] dark:text-[#98989d]">
            {search ? "لا توجد نتائج" : "لا يوجد مستخدمين"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <div key={u.uid}
              className={`rounded-xl bg-white dark:bg-[#1c1c1e] border p-4 ${
                u.isBanned ? "border-[#ff3b30]/20" : "border-black/5 dark:border-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  u.isBanned
                    ? "bg-[#ff3b30]/10 text-[#ff3b30]"
                    : u.isPremium
                    ? "bg-[#FF9500]/10 text-[#FF9500]"
                    : "bg-[#007AFF]/10 text-[#007AFF]"
                }`}>
                  {avatarInitial(u)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold truncate ${u.isBanned ? "text-[#ff3b30]/70" : ""}`}>
                      {u.displayName || u.email || u.uid.slice(0, 8)}
                    </span>
                    {u.isPremium && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FF9500]/10 text-[#FF9500] font-medium shrink-0">مميز</span>
                    )}
                    {u.isBanned && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#ff3b30]/10 text-[#ff3b30] font-medium shrink-0">محظور</span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#86868b] dark:text-[#98989d] truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleTogglePremium(u.uid, u.isPremium)}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                      u.isPremium
                        ? "bg-[#FF9500]/10 text-[#FF9500] hover:bg-[#FF9500]/15"
                        : "text-[#86868b] dark:text-[#98989d] hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                    title={u.isPremium ? "إلغاء البريميوم" : "تفعيل البريميوم"}
                  >
                    <Crown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleBan(u.uid, u.isBanned)}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                      u.isBanned
                        ? "bg-[#34C759]/10 text-[#34C759] hover:bg-[#34C759]/15"
                        : "text-[#86868b] dark:text-[#98989d] hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                    title={u.isBanned ? "إلغاء الحظر" : "حظر"}
                  >
                    {u.isBanned ? <UserCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
