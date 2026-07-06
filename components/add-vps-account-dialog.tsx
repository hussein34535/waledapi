"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

const formSchema = z.object({
  type: z.enum(["SSH", "VMESS", "VLESS", "TROJAN", "SOCKS", "SHADOWSOCKS"]),
  server_name: z.string().min(1, "Server name is required"),
  ip_address: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  expiry_date: z.string().optional(),
  config: z.string().optional(),
  status: z.enum(["active", "inactive"]),
})

type FormValues = z.infer<typeof formSchema>

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
    defaultValues: {
      type: "VLESS",
      server_name: "",
      ip_address: "",
      username: "",
      password: "",
      expiry_date: "",
      config: "",
      status: "active",
    },
  })

  const selectedType = form.watch("type")

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)

    try {
      const baseAccount: any = {
        type: values.type,
        server_name: values.server_name,
        status: values.status,
        userId: userId || "anonymous",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      if (values.type === "SSH") {
        baseAccount.ip_address = values.ip_address
        baseAccount.username = values.username
        baseAccount.password = values.password
        baseAccount.expiry_date = values.expiry_date
      } else {
        baseAccount.config = values.config
      }

      const accountsRef = ref(database, "vpsAccounts")
      const newAccountRef = push(accountsRef)
      await set(newAccountRef, baseAccount)

      const newAccountId = newAccountRef.key

      if (onAccountAdded && newAccountId) {
        onAccountAdded(newAccountId)
      }

      toast.success("Account added successfully")
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error("Error adding account:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"

      toast.error("Error", {
        description: `Failed to add VPS account: ${errorMessage}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إضافة حساب</DialogTitle>
          <DialogDescription>أدخل تفاصيل الحساب الجديد.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>النوع</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر النوع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SSH">SSH</SelectItem>
                        <SelectItem value="VMESS">VMess</SelectItem>
                        <SelectItem value="VLESS">VLESS</SelectItem>
                        <SelectItem value="TROJAN">TROJAN</SelectItem>
                        <SelectItem value="SOCKS">SOCKS</SelectItem>
                        <SelectItem value="SHADOWSOCKS">Shadowsocks</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحالة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="inactive">غير نشط</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="server_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم السيرفر</FormLabel>
                  <FormControl>
                    <Input placeholder="اسم السيرفر" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedType === "SSH" && (
              <>
                <FormField
                  control={form.control}
                  name="ip_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IP Address</FormLabel>
                      <FormControl>
                        <Input placeholder="192.168.1.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {(selectedType === "VMESS" || selectedType === "VLESS" || selectedType === "TROJAN" || selectedType === "SOCKS" || selectedType === "SHADOWSOCKS") && (
              <FormField
                control={form.control}
                name="config"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Config</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={selectedType === "VMESS" ? "vmess://..." : selectedType === "VLESS" ? "vless://..." : " configuration URL"}
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "جاري الإضافة..." : "إضافة حساب"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

