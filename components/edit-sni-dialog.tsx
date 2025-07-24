"use client"

import { useState, useEffect } from "react"
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
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import type { SniConfig } from "@/lib/types"

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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      host: sni.host,
    },
  })
  
  useEffect(() => {
    form.reset({ host: sni.host });
  }, [sni, form]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/sni', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sni.id, host: values.host }),
      });

      if (!response.ok) {
        throw new Error('Failed to update SNI');
      }
      toast.success("SNI updated successfully");
      onSniUpdated();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update SNI");
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit SNI: {sni.id}</DialogTitle>
          <DialogDescription>
            Update the host for this SNI configuration.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="host"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Host</FormLabel>
                  <FormControl>
                    <Input placeholder="example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update SNI"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
