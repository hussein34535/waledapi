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
  server_name: z.string().min(1, "Server name is required"),
  config: z.string().min(1, "Config is required"),
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
      server_name: "",
      status: "active",
      config: "",
    },
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)

    try {
      const newAccount = {
        type: "VLESS",
        server_name: values.server_name,
        config: values.config,
        status: values.status,
        userId: userId || "anonymous",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const accountsRef = ref(database, "vpsAccounts")
      const newAccountRef = push(accountsRef)
      await set(newAccountRef, newAccount)

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
          <DialogTitle>Add VLESS Account</DialogTitle>
          <DialogDescription>Enter the details for the new VLESS account.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="server_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My VLESS Server" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Config</FormLabel>
                  <FormControl>
                    <Textarea placeholder="vless://..." className="min-h-[100px]" {...field} />
                  </FormControl>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Account"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

