"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Layers, Server, Globe, DollarSign, Users, Sun, Moon, LogOut } from "lucide-react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import type React from "react"

const tabs = [
  { href: "/dashboard", label: "الرئيسية", icon: Layers },
  { href: "/dashboard/accounts", label: "الحسابات", icon: Server },
  { href: "/dashboard/sni", label: "SNI", icon: Globe },
  { href: "/dashboard/pricing", label: "الأسعار", icon: DollarSign },
  { href: "/dashboard/users", label: "المستخدمين", icon: Users },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0a0a0a]" dir="rtl">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
        <div className="max-w-3xl mx-auto flex items-center justify-between h-12 px-4">
          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <span className="text-[15px] font-bold tracking-tight">WaledVPN</span>
          </Link>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 mx-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = tab.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(tab.href)
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                    active
                      ? "text-[#007AFF] bg-[#007AFF]/8"
                      : "text-[#86868b] dark:text-[#98989d] hover:text-[#3c3c43] dark:hover:text-[#d1d1d6] hover:bg-black/3 dark:hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={active ? 2 : 1.5} />
                  <span className="hidden md:inline">{tab.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Theme & Logout */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center shrink-0 transition-colors"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[#86868b] dark:text-[#98989d]" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#86868b] dark:text-[#98989d]" />
            </button>
            <button
              onClick={() => signOut(auth)}
              className="h-8 w-8 rounded-lg hover:bg-[#ff3b30]/10 flex items-center justify-center shrink-0 transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="h-4 w-4 text-[#86868b] dark:text-[#98989d] hover:text-[#ff3b30]" />
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
