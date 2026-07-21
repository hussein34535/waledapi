"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Layers, Server, Globe, DollarSign, Users, Shield } from "lucide-react"
import type React from "react"

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

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0a0a0a]" dir="rtl">
      <main className="pb-20">{children}</main>

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
