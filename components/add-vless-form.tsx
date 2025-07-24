"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const FormSchema = z.object({
  name: z.string().min(1, { message: "الاسم مطلوب" }),
  uuid: z.string().uuid({ message: "UUID غير صالح" }),
  server: z.string().min(1, { message: "الخادم مطلوب" }),
  port: z.coerce.number().min(1, { message: "المنفذ مطلوب" }),
  path: z.string().optional(),
  sni: z.string().optional(),
})

export default function AddVlessForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      uuid: "",
      server: "",
      port: 443,
      path: "",
      sni: "",
    },
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const response = await fetch('/api/vless', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('فشل إضافة VLESS');
      }

      toast.success("تمت إضافة VLESS بنجاح!")
      form.reset();
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة VLESS.")
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الاسم</FormLabel>
              <FormControl>
                <Input placeholder="اسم الإعداد" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="uuid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>UUID</FormLabel>
              <FormControl>
                <Input placeholder="أدخل UUID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="server"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الخادم</FormLabel>
              <FormControl>
                <Input placeholder="عنوان الخادم" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="port"
          render={({ field }) => (
            <FormItem>
              <FormLabel>المنفذ</FormLabel>
              <FormControl>
                <Input type="number" placeholder="443" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="path"
          render={({ field }) => (
            <FormItem>
              <FormLabel>المسار (اختياري)</FormLabel>
              <FormControl>
                <Input placeholder="/path" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sni"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SNI (اختياري)</FormLabel>
              <FormControl>
                <Input placeholder="example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">إضافة</Button>
      </form>
    </Form>
  )
}
