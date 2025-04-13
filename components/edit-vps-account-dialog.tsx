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
  DialogFooter,
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

const formSchema = z.object({
  type: z.enum(["SSH", "VLESS", "TROJAN", "SOCKS", "SHADOWSOCKS"]),
  server_name: z.string().min(1, "Server name is required"),
  ip_address: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  expiry_date: z.string().optional(),
  config: z.string().optional(),
  status: z.enum(["active", "inactive"]),
}).refine(data => {
  if (data.type === "SSH") {
    return data.ip_address && data.username && data.password && data.expiry_date
  }
  if (data.type === "VLESS" || data.type === "TROJAN" || data.type === "SOCKS" || data.type === "SHADOWSOCKS") {
    return data.config
  }
  return true
}, {
  message: "Required fields are missing based on the selected type",
  path: ["ip_address", "username", "password", "expiry_date", "config"]
})

type FormValues = z.infer<typeof formSchema>

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
      type: account.type as "SSH" | "VLESS" | "TROJAN" | "SOCKS" | "SHADOWSOCKS",
      server_name: account.server_name || "",
      ip_address: account.type === "SSH" ? account.ip_address : "",
      username: account.type === "SSH" ? account.username : "",
      password: account.type === "SSH" ? account.password : "",
      expiry_date: account.type === "SSH" ? account.expiry_date : "",
      status: account.status,
      config: account.type !== "SSH" ? account.config : "",
    },
  })

  const onSubmit = async (values: FormValues) => {
    if (!account.id) return

    setIsSubmitting(true)

    try {
      // Reference to the specific account in Realtime Database
      const accountRef = ref(database, `vpsAccounts/${account.id}`)

      // Clean up the data based on account type
      const updateData: any = {
        ...values,
        updatedAt: Date.now(),
      }

      // Remove SSH-specific fields for non-SSH accounts
      if (values.type !== "SSH") {
        delete updateData.ip_address
        delete updateData.username
        delete updateData.password
        delete updateData.expiry_date
      }

      // Remove config field for SSH accounts
      if (values.type === "SSH") {
        delete updateData.config
      }


      await update(accountRef, updateData)

      toast("Account updated successfully", {
        description: "VPS account has been updated successfully.",
      })
      onOpenChange(false)
      onAccountUpdated()
    } catch (error) {
      console.error("Error updating account:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"

      toast.error(`Failed to update VPS account: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit VPS Account</DialogTitle>
          <DialogDescription>Update VPS account details.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SSH">SSH</SelectItem>
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
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
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
                  <FormLabel>Server Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My VPS Server" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("type") === "SSH" && (
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

            {(form.watch("type") === "VLESS" || form.watch("type") === "TROJAN" || form.watch("type") === "SOCKS" || form.watch("type") === "SHADOWSOCKS") && (
              <FormField
                control={form.control}
                name="config"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Config</FormLabel>
                    <FormControl>
                      <Input placeholder="Configuration URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Account"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

