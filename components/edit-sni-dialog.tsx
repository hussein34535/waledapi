"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import type { SniConfig } from "@/lib/types"
import { useAuth } from "@/components/auth-provider"
import { X, Globe } from "lucide-react"

const formSchema = z.object({
  host: z.string().min(1, "Host is required"),
})

type FormValues = z.infer<typeof formSchema>

interface EditSniDialogProps {
  sni: SniConfig;
  open: boolean
  onOpenChange: (open: boolean) => void
  onSniUpdated: () => void;
}

export function EditSniDialog({ sni, open, onOpenChange, onSniUpdated }: EditSniDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { host: sni.host },
  })

  useEffect(() => { form.reset({ host: sni.host }) }, [sni, form])

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/sni', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ id: sni.id, host: values.host }),
      });
      if (!response.ok) throw new Error();
      toast.success("تم تحديث SNI بنجاح");
      onSniUpdated();
      onOpenChange(false);
    } catch {
      toast.error("فشل تحديث SNI")
    } finally { setIsSubmitting(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl sm:rounded-3xl border-border/60 p-0 gap-0 overflow-hidden bg-card">
        <div className="p-6 pb-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">تعديل SNI</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">{sni.id}</DialogDescription>
              </div>
            </div>
            <button onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-xl hover:bg-muted flex items-center justify-center">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="host" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground">Host</FormLabel>
                  <FormControl>
                    <Input placeholder="example.com" {...field} className="h-11 rounded-xl border-border/60 bg-background/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-11 rounded-xl border-border/60">
                  إلغاء
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                  {isSubmitting ? "جارِ..." : "حفظ"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
