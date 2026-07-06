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

const formSchema = z.object({
  type: z.enum(["SSH", "VMESS", "VLESS"]),
  server_name: z.string().min(1, "Server name is required"),
  ip_address: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  expiry_date: z.string().optional(),
  config: z.string().optional(),
  status: z.enum(["active", "inactive"]),
}).refine(data => {
  if (data.type === "SSH") return data.ip_address && data.username && data.password && data.expiry_date
  if (["VMESS", "VLESS"].includes(data.type)) return data.config
  return true
}, { message: "Required fields are missing", path: ["ip_address"] })

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
      ip_address: account.type === "SSH" ? account.ip_address : "",
      username: account.type === "SSH" ? account.username : "",
      password: account.type === "SSH" ? account.password : "",
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
      const updateData: any = { ...values, updatedAt: Date.now() }
      if (values.type !== "SSH") { delete updateData.ip_address; delete updateData.username; delete updateData.password; delete updateData.expiry_date }
      if (values.type === "SSH") delete updateData.config
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
                  <FormField control={form.control} name="ip_address" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">IP Address</FormLabel>
                      <FormControl>
                        <Input placeholder="192.168.1.1" {...field} className="h-11 rounded-xl border-border/60 bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="username" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground">Username</FormLabel>
                        <FormControl>
                          <Input placeholder="username" {...field} className="h-11 rounded-xl border-border/60 bg-background/50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground">Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="h-11 rounded-xl border-border/60 bg-background/50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="expiry_date" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="h-11 rounded-xl border-border/60 bg-background/50" />
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
