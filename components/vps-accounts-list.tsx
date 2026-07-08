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
  SSH: "from-cyan-500 to-blue-600",
  VMESS: "from-violet-500 to-purple-600",
  VLESS: "from-emerald-500 to-teal-600",
  SLOWDNS: "from-amber-500 to-orange-600",
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
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl bg-card border border-border/50 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-muted animate-shimmer" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted rounded-lg w-1/3 animate-shimmer" />
                <div className="h-3 bg-muted rounded-lg w-1/4 animate-shimmer" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded-lg w-full animate-shimmer" />
              <div className="h-3 bg-muted rounded-lg w-2/3 animate-shimmer" />
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
      <div className="space-y-3">
        {accounts.map((account, idx) => {
          const Icon = TYPE_ICONS[account.type] || Terminal
          const gradient = TYPE_COLORS[account.type] || "from-primary to-primary"
          const isExpanded = expandedId === account.id
          const isNew = account.id === newAccountId

          return (
            <div
              key={account.id}
              className={`rounded-2xl bg-card border transition-all duration-500 ${
                isNew
                  ? "border-primary/40 shadow-lg shadow-primary/10 animate-glow-pulse"
                  : "border-border/50 hover:border-border/80"
              } ${isExpanded ? "shadow-md" : "shadow-sm"} animate-slide-up`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : account.id!)}
                className="w-full text-right p-4 active:bg-muted/20 transition-colors rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-20 flex items-center justify-center shadow-inner`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{account.server_name}</span>
                      {isNew && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          جديد
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{account.type}</span>
                      <span className={`h-1.5 w-1.5 rounded-full animate-status-pulse ${
                        account.status === "active" ? "bg-success" : "bg-muted-foreground"
                      }`} />
                      <span className="text-xs text-muted-foreground">{account.status === "active" ? "نشط" : "غير نشط"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditAccount(account) }}
                      className="h-8 w-8 rounded-xl hover:bg-muted flex items-center justify-center transition-colors active:scale-90"
                    >
                      <Edit3 className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteAccount(account) }}
                      className="h-8 w-8 rounded-xl hover:bg-destructive/10 flex items-center justify-center transition-colors active:scale-90"
                    >
                      <Trash2 className="h-4 w-4 text-destructive/70" />
                    </button>
                    <div className="h-6 w-6 flex items-center justify-center">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-border/30 mt-0 animate-scale-in">
                  <div className="pt-3 space-y-2.5">
                    <Field label="اسم السيرفر" value={account.server_name} onCopy={() => copyText(account.server_name, "اسم السيرفر")} />

                    {account.type === "SSH" ? (
                      <>
                        <Field label="IP Address" value={account.ip_address || ""} onCopy={() => copyText(account.ip_address || "", "IP")} />
                        <Field label="Username" value={account.username || ""} onCopy={() => copyText(account.username || "", "Username")} />
                        <Field label="Password" value="••••••••" masked={account.password} onCopy={() => copyText(account.password || "", "Password")} />
                        <Field label="تاريخ الانتهاء" value={account.expiry_date || ""} />
                      </>
                    ) : ["VMESS", "VLESS", "SLOWDNS"].includes(account.type) ? (
                      <Field label="Config" value={account.config || ""} mono onCopy={() => copyText(account.config || "", "Config")} />
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
                    <span className="text-2xs text-muted-foreground">
                      أضيف {formatDistanceToNow(account.createdAt, { addSuffix: true, locale: ar })}
                    </span>
                    <span className="text-2xs text-muted-foreground">
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
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5 max-w-[60%]">
        <span className={`text-sm truncate ${mono ? "font-mono text-[13px]" : "font-medium"}`}>
          {value}
        </span>
        {onCopy && (
          <button
            onClick={onCopy}
            className="h-6 w-6 rounded-lg hover:bg-muted flex items-center justify-center shrink-0 active:scale-90 transition-all"
          >
            <Copy className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  )
}
