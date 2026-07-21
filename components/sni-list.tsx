"use client"

import { useState } from "react"
import type { SniConfig } from "@/lib/types"
import { Trash2, Edit, Copy, Globe } from "lucide-react"
import { toast } from "sonner"
import { EditSniDialog } from "./edit-sni-dialog"
import { useAuth } from "@/components/auth-provider"

interface SniListProps {
  sniList: SniConfig[]
  isLoading: boolean
  onListChange: () => void;
}

export default function SniList({ sniList, isLoading, onListChange }: SniListProps) {
  const { user } = useAuth();
  const [editingSni, setEditingSni] = useState<SniConfig | null>(null);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`تم نسخ ${label}`)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف SNI?")) return;
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/sni?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      if (!response.ok) throw new Error();
      toast.success("تم حذف SNI بنجاح");
      onListChange();
    } catch {
      toast.error("فشل حذف SNI");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] p-4 h-16 animate-pulse" />
        ))}
      </div>
    )
  }

  if (sniList.length === 0) return null

  return (
    <>
      <div className="space-y-2">
        {sniList.map((sni) => (
          <div
            key={sni.id}
            className="rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-[#007AFF]/10 flex items-center justify-center shrink-0">
                <Globe className="h-4 w-4 text-[#007AFF]" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{sni.id}</p>
                <p className="text-[13px] text-[#86868b] dark:text-[#98989d] truncate font-mono">{sni.host}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => copyText(sni.id, "Name")} className="h-7 w-7 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center active:scale-90">
                <Copy className="h-3.5 w-3.5 text-[#86868b] dark:text-[#98989d]" />
              </button>
              <button onClick={() => copyText(sni.host, "Host")} className="h-7 w-7 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center active:scale-90">
                <Copy className="h-3.5 w-3.5 text-[#86868b] dark:text-[#98989d]" />
              </button>
              <button onClick={() => setEditingSni(sni)} className="h-7 w-7 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center active:scale-90">
                <Edit className="h-3.5 w-3.5 text-[#86868b] dark:text-[#98989d]" />
              </button>
              <button onClick={() => handleDelete(sni.id)} className="h-7 w-7 rounded-lg hover:bg-[#ff3b30]/10 flex items-center justify-center active:scale-90">
                <Trash2 className="h-3.5 w-3.5 text-[#ff3b30]/70" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {editingSni && (
        <EditSniDialog
          sni={editingSni}
          open={!!editingSni}
          onOpenChange={(open) => !open && setEditingSni(null)}
          onSniUpdated={onListChange}
        />
      )}
    </>
  )
}
