"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Layers, Server, Globe, DollarSign, FileText } from "lucide-react"

const tabs = [
  { href: "/dashboard", label: "الرئيسية", icon: Layers },
  { href: "/dashboard/accounts", label: "الحسابات", icon: Server },
  { href: "/dashboard/sni", label: "SNI", icon: Globe },
  { href: "/dashboard/pricing", label: "الأسعار", icon: DollarSign },
  { href: "/api-docs", label: "API", icon: FileText },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0a0a0a] flex flex-col" dir="rtl">
      <main className="flex-1 pb-20">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl border-t border-black/5 dark:border-white/5 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = tab.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(tab.href)

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-1 min-w-0 px-3 py-1 rounded-xl transition-colors ${
                  active
                    ? "text-[#007AFF]"
                    : "text-[#8e8e93] hover:text-[#3c3c43] dark:hover:text-[#d1d1d6]"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
