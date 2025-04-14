"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push("/dashboard")
  }, [router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">VPS Management System</h1>
      
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link href="/dashboard" className="w-full">
          <Button className="w-full" size="lg">
            لوحة التحكم
          </Button>
        </Link>
        
        <Link href="/notifications" className="w-full">
          <Button className="w-full" variant="outline" size="lg">
            إرسال إشعارات للتطبيق
          </Button>
        </Link>
      </div>
    </main>
  )
}
