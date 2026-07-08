"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { ref, push, set } from "firebase/database"
import { database } from "@/lib/firebase"
import { X, Terminal, Wifi } from "lucide-react"

function parseSshString(s: string) {
  const atIdx = s.indexOf("@")
  if (atIdx === -1) return null
  const hostPart = s.slice(0, atIdx)
  const credPart = s.slice(atIdx + 1)
  const colonIdx = credPart.indexOf(":")
  if (colonIdx === -1) return null
  const username = credPart.slice(0, colonIdx)
  const password = credPart.slice(colonIdx + 1)
  const hostColonIdx = hostPart.lastIndexOf(":")
  let ip_address = hostPart
  if (hostColonIdx !== -1) ip_address = hostPart.slice(0, hostColonIdx)
  return { ip_address, username, password }
}

const formSchema = z.object({
  type: z.enum(["SSH", "VMESS", "VLESS"]),
  server_name: z.string().min(1, "اسم السيرفر مطلوب"),
  ssh_string: z.string().optional(),
  ip_address: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  expiry_date: z.string().optional(),
  config: z.string().optional(),
  status: z.enum(["active", "inactive"]),
})

type FormValues = z.infer<typeof formSchema>

const TYPE_OPTIONS = [
  { value: "SSH", label: "SSH", icon: Terminal },
  { value: "VMESS", label: "VMess", icon: Wifi },
  { value: "VLESS", label: "VLESS", icon: Wifi },
]

interface AddVpsAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId?: string
  onAccountAdded?: (accountId: string) => void
}

export function AddVpsAccountDialog({ open, onOpenChange, userId, onAccountAdded }: AddVpsAccountDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: "VLESS", server_name: "", ssh_string: "", ip_address: "", username: "", password: "", expiry_date: "", config: "", status: "active" },
  })

  const selectedType = form.watch("type")

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      const base: any = { type: values.type, server_name: values.server_name, status: values.status, userId: userId || "anonymous", createdAt: Date.now(), updatedAt: Date.now() }
      if (values.type === "SSH") {
        const parsed = values.ssh_string ? parseSshString(values.ssh_string) : null
        base.ip_address = parsed?.ip_address || values.ip_address
        base.username = parsed?.username || values.username
        base.password = parsed?.password || values.password
        base.expiry_date = values.expiry_date
        base.config = values.ssh_string
      } else {
        base.config = values.config
      }
      const ref_ = ref(database, "vpsAccounts")
      const newRef = push(ref_)
      await set(newRef, base)
      if (onAccountAdded && newRef.key) onAccountAdded(newRef.key)
      toast.success("تمت إضافة الحساب بنجاح")
      form.reset()
      onOpenChange(false)
    } catch {
      toast.error("فشلت إضافة الحساب")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl sm:rounded-3xl border-border/60 p-0 gap-0 overflow-hidden bg-card">
        <div className="p-6 pb-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">إضافة حساب</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">أدخل تفاصيل الحساب الجديد</DialogDescription>
            </div>
            <button onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-xl hover:bg-muted flex items-center justify-center transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-none">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">النوع</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background/50">
                          <SelectValue placeholder="اختر النوع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-border/60">
                        {TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className="flex items-center gap-2">
                              <opt.icon className="h-4 w-4" />
                              {opt.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">الحالة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background/50">
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-border/60">
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="inactive">غير نشط</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="server_name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground">اسم السيرفر</FormLabel>
                  <FormControl>
                    <Input placeholder="اسم السيرفر" {...field} className="h-11 rounded-xl border-border/60 bg-background/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {selectedType === "SSH" ? (
                <FormField control={form.control} name="ssh_string" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">سطر الاتصال (IP:Port@Username:Password)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="72.62.61.226:443@jdshgkh4rr44:nldjhfldshg4"
                        className="min-h-[80px] rounded-xl border-border/60 bg-background/50 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              ) : (
                <FormField control={form.control} name="config" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">Config</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={selectedType === "VMESS" ? "vmess://..." : selectedType === "VLESS" ? "vless://..." : "configuration URL"}
                        className="min-h-[100px] rounded-xl border-border/60 bg-background/50 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-11 rounded-xl border-border/60">
                  إلغاء
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                  {isSubmitting ? "جاري الإضافة..." : "إضافة حساب"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
