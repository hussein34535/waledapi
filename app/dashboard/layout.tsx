"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Layers, Server, Globe, DollarSign, Users, Shield, LogOut } from "lucide-react"
import type React from "react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/components/auth-provider"

const tabs = [
  { href: "/dashboard", label: "الرئيسية", icon: Layers },
  { href: "/dashboard/accounts", label: "الحسابات", icon: Server },
  { href: "/dashboard/sni", label: "SNI", icon: Globe },
  { href: "/dashboard/pricing", label: "الأسعار", icon: DollarSign },
  { href: "/dashboard/admins", label: "المشرفين", icon: Shield },
  { href: "/dashboard/users", label: "المستخدمين", icon: Users },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch {}
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0a0a0a]" dir="rtl">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl border-b border-black/[0.05] dark:border-white/[0.05] px-4 py-2.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">لوحة التحكم</span>
            {user?.email && (
              <span className="text-xs text-[#8e8e93] bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full truncate max-w-[160px]">
                {user.email}
              </span>
            )}
          </div>
          {user && (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-[#FF3B30] hover:bg-[#FF3B30]/10 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          )}
        </div>
      </header>

      <main className="pb-20">
        <Suspense fallback={<div className="p-6 text-center text-muted-foreground">جاري التحميل...</div>}>
          {children}
        </Suspense>
      </main>

      {/* iOS Tab Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl border-t border-black/[0.04] dark:border-white/[0.04]">
        <div className="max-w-2xl mx-auto flex items-center justify-evenly h-[50px] px-2 pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = tab.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center gap-0 min-w-0 w-14 py-1"
              >
                <Icon
                  className="h-[22px] w-[22px] transition-colors"
                  strokeWidth={active ? 2 : 1.5}
                  style={{ color: active ? "#007AFF" : "#8e8e93" }}
                />
                <span
                  className="text-[10px] font-medium leading-none mt-0.5 transition-colors"
                  style={{ color: active ? "#007AFF" : "#8e8e93" }}
                >
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
