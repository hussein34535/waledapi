"use client"

import { useState } from "react"
import type { VpsAccount } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { Copy, Edit3, Trash2, Terminal, Wifi, Globe, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import EditVpsAccountDialog from "@/components/edit-vps-account-dialog"
import DeleteVpsAccountDialog from "@/components/delete-vps-account-dialog"

interface VpsAccountsListProps {
  accounts: VpsAccount[]
  isLoading: boolean
  newAccountId?: string | null
}

const TYPE_ICONS: Record<string, any> = {
  SSH: Terminal,
  VMESS: Wifi,
  VLESS: Wifi,
  SLOWDNS: Globe,
}

const TYPE_COLORS: Record<string, string> = {
  SSH: "#007AFF",
  VMESS: "#AF52DE",
  VLESS: "#34C759",
  SLOWDNS: "#FF9500",
}

export default function VpsAccountsList({ accounts, isLoading, newAccountId }: VpsAccountsListProps) {
  const { toast } = useToast()
  const [editAccount, setEditAccount] = useState<VpsAccount | null>(null)
  const [deleteAccount, setDeleteAccount] = useState<VpsAccount | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "تم النسخ", description: `تم نسخ ${label}` })
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/3 rounded-lg bg-[#f2f2f7] dark:bg-[#2c2c2e] animate-pulse" />
                <div className="h-3 w-1/4 rounded-lg bg-[#f2f2f7] dark:bg-[#2c2c2e] animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (accounts.length === 0) {
    return null
  }

  return (
    <>
      <div className="space-y-2">
        {accounts.map((account, idx) => {
          const Icon = TYPE_ICONS[account.type] || Terminal
          const color = TYPE_COLORS[account.type] || "#007AFF"
          const isExpanded = expandedId === account.id
          const isNew = account.id === newAccountId

          return (
            <div
              key={account.id}
              className={`rounded-2xl bg-white dark:bg-[#1c1c1e] border transition-all duration-300 ${
                isNew
                  ? "border-[#007AFF]/30 shadow-[0_0_0_2px_rgba(0,122,255,0.1)]"
                  : "border-black/5 dark:border-white/5"
              }`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : account.id!)}
                className="w-full text-right p-4 active:bg-[#f2f2f7] dark:active:bg-[#2c2c2e] transition-colors rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}14` }}>
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[15px] truncate">{account.server_name}</span>
                      {isNew && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] font-medium">جديد</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[13px] text-[#86868b] dark:text-[#98989d]">{account.type}</span>
                      <span className={`h-1.5 w-1.5 rounded-full ${account.status === "active" ? "bg-[#34C759]" : "bg-[#c7c7cc] dark:bg-[#636366]"}`} />
                      <span className="text-[13px] text-[#86868b] dark:text-[#98989d]">{account.status === "active" ? "نشط" : "غير نشط"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditAccount(account) }}
                      className="h-8 w-8 rounded-lg hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] flex items-center justify-center transition-colors active:scale-90"
                    >
                      <Edit3 className="h-4 w-4 text-[#86868b] dark:text-[#98989d]" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteAccount(account) }}
                      className="h-8 w-8 rounded-lg hover:bg-[#ff3b30]/10 flex items-center justify-center transition-colors active:scale-90"
                    >
                      <Trash2 className="h-4 w-4 text-[#ff3b30]/70" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-[#c7c7cc] dark:text-[#48484a] mr-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#c7c7cc] dark:text-[#48484a] mr-1" />
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-black/5 dark:border-white/5">
                  <div className="pt-3 space-y-2.5">
                    <Field label="اسم السيرفر" value={account.server_name} onCopy={() => copyText(account.server_name, "اسم السيرفر")} />

                    {account.type === "SSH" ? (
                      <>
                        <Field label="IP Address" value={account.ip_address || ""} onCopy={() => copyText(account.ip_address || "", "IP")} />
                        <Field label="Port" value={account.port || "443"} onCopy={() => copyText(account.port || "443", "Port")} />
                        <Field label="Username" value={account.username || ""} onCopy={() => copyText(account.username || "", "Username")} />
                        <Field label="Password" value="••••••••" masked={account.password} onCopy={() => copyText(account.password || "", "Password")} />
                        <Field label="تاريخ الانتهاء" value={account.expiry_date || ""} />
                      </>
                    ) : account.type === "SLOWDNS" ? (
                      <>
                        <Field label="IP Address" value={account.ip_address || ""} onCopy={() => copyText(account.ip_address || "", "IP")} />
                        <Field label="Username" value={account.username || ""} onCopy={() => copyText(account.username || "", "Username")} />
                        <Field label="Password" value="••••••••" masked={account.password} onCopy={() => copyText(account.password || "", "Password")} />
                        <Field label="DNS IP" value={account.dns_ip || ""} onCopy={() => copyText(account.dns_ip || "", "DNS IP")} />
                        <Field label="NS" value={account.ns || ""} onCopy={() => copyText(account.ns || "", "NS")} />
                        <Field label="Public Key" value={account.public_key || ""} mono onCopy={() => copyText(account.public_key || "", "Public Key")} />
                        <Field label="تاريخ الانتهاء" value={account.expiry_date || ""} />
                      </>
                    ) : ["VMESS", "VLESS"].includes(account.type) ? (
                      <Field label="Config" value={account.config || ""} mono onCopy={() => copyText(account.config || "", "Config")} />
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                    <span className="text-[11px] text-[#86868b] dark:text-[#98989d]">
                      أضيف {formatDistanceToNow(account.createdAt, { addSuffix: true, locale: ar })}
                    </span>
                    <span className="text-[11px] text-[#86868b] dark:text-[#98989d]">
                      آخر تحديث {account.updatedAt ? formatDistanceToNow(account.updatedAt, { addSuffix: true, locale: ar }) : "غير معروف"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {editAccount && (
        <EditVpsAccountDialog
          account={editAccount}
          open={true}
          onOpenChange={(open) => !open && setEditAccount(null)}
          onAccountUpdated={() => {}}
        />
      )}
      {deleteAccount && (
        <DeleteVpsAccountDialog
          account={deleteAccount}
          open={true}
          onOpenChange={(open) => !open && setDeleteAccount(null)}
        />
      )}
    </>
  )
}

function Field({ label, value, mono, masked, onCopy }: {
  label: string
  value: string
  mono?: boolean
  masked?: string
  onCopy?: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-[#86868b] dark:text-[#98989d]">{label}</span>
      <div className="flex items-center gap-1.5 max-w-[60%]">
        <span className={`text-sm truncate ${mono ? "font-mono text-[13px]" : "font-medium"}`}>
          {value}
        </span>
        {onCopy && (
          <button
            onClick={onCopy}
            className="h-6 w-6 rounded-lg hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] flex items-center justify-center shrink-0 active:scale-90 transition-all"
          >
            <Copy className="h-3 w-3 text-[#86868b] dark:text-[#98989d]" />
          </button>
        )}
      </div>
    </div>
  )
}
