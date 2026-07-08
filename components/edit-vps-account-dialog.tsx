"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { VpsAccount } from "@/lib/types"
import { ref, update } from "firebase/database"
import { database } from "@/lib/firebase"
import { toast } from "sonner"
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

function composeSshString(account: VpsAccount) {
  if (account.config) return account.config
  const port = account.ip_address?.includes(":") ? "" : ":443"
  return `${account.ip_address}${port}@${account.username}:${account.password}`
}

const formSchema = z.object({
  type: z.enum(["SSH", "VMESS", "VLESS"]),
  server_name: z.string().min(1, "Server name is required"),
  ssh_string: z.string().optional(),
  expiry_date: z.string().optional(),
  config: z.string().optional(),
  status: z.enum(["active", "inactive"]),
}).refine(data => {
  if (["VMESS", "VLESS"].includes(data.type)) return data.config
  return true
}, { message: "Required fields are missing", path: ["config"] })

type FormValues = z.infer<typeof formSchema>

const TYPE_ICONS: Record<string, any> = { SSH: Terminal, VMESS: Wifi, VLESS: Wifi }

interface EditVpsAccountDialogProps {
  account: VpsAccount
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccountUpdated: () => void
}

export default function EditVpsAccountDialog({ account, open, onOpenChange, onAccountUpdated }: EditVpsAccountDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: account.type as any,
      server_name: account.server_name || "",
      ssh_string: account.type === "SSH" ? composeSshString(account) : "",
      expiry_date: account.type === "SSH" ? account.expiry_date : "",
      status: account.status,
      config: account.type !== "SSH" ? account.config : "",
    },
  })

  const watchType = form.watch("type")
  const Icon = TYPE_ICONS[watchType] || Wifi

  const onSubmit = async (values: FormValues) => {
    if (!account.id) return
    setIsSubmitting(true)
    try {
      const updateData: any = { type: values.type, server_name: values.server_name, status: values.status, updatedAt: Date.now() }
      if (values.type === "SSH") {
        const parsed = values.ssh_string ? parseSshString(values.ssh_string) : null
        if (parsed) {
          updateData.ip_address = parsed.ip_address
          updateData.username = parsed.username
          updateData.password = parsed.password
        }
        updateData.expiry_date = values.expiry_date
        updateData.config = values.ssh_string
      } else {
        updateData.config = values.config
      }
      await update(ref(database, `vpsAccounts/${account.id}`), updateData)
      toast.success("تم تحديث الحساب بنجاح")
      onOpenChange(false)
      onAccountUpdated()
    } catch {
      toast.error("فشل تحديث الحساب")
    } finally { setIsSubmitting(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl sm:rounded-3xl border-border/60 p-0 gap-0 overflow-hidden bg-card">
        <div className="p-6 pb-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">تعديل الحساب</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">{account.server_name}</DialogDescription>
              </div>
            </div>
            <button onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-xl hover:bg-muted flex items-center justify-center">
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
                    <FormLabel className="text-xs font-medium text-muted-foreground">Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background/50">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-border/60">
                        <SelectItem value="SSH">SSH</SelectItem>
                        <SelectItem value="VMESS">VMess</SelectItem>
                        <SelectItem value="VLESS">VLESS</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background/50">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-border/60">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="server_name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground">Server Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My VPS Server" {...field} className="h-11 rounded-xl border-border/60 bg-background/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {watchType === "SSH" && (
                <>
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
                  <FormField control={form.control} name="expiry_date" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">تاريخ الانتهاء</FormLabel>
                      <FormControl>
                        <input type="date" {...field} className="flex h-11 w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </>
              )}

              {["VMESS", "VLESS"].includes(watchType) && (
                <FormField control={form.control} name="config" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">Config</FormLabel>
                    <FormControl>
                      <Input placeholder="Configuration URL" {...field} className="h-11 rounded-xl border-border/60 bg-background/50" />
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
                  {isSubmitting ? "جاري الحفظ..." : "حفظ التعديلات"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
