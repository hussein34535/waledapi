"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Props {
  setIsLoggedIn: (value: boolean) => void
}

export default function LoginForm({ setIsLoggedIn }: Props) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const router = useRouter()
  const { toast } = useToast()
  const honeypotRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    startTimeRef.current = Date.now()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (honeypotRef.current?.value) {
      return
    }

    const elapsed = Date.now() - startTimeRef.current
    if (elapsed < 2000) {
      toast({
        title: "خطأ",
        description: "يرجى الانتظار قليلاً قبل المحاولة",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          honeypot: "",
          timestamp: String(Date.now()),
        }),
      })

      if (response.ok) {
        setFailedAttempts(0)
        setIsLoggedIn(true)
        router.push("/dashboard")
      } else {
        setFailedAttempts(prev => prev + 1)
        const delay = Math.min(failedAttempts * 1000, 5000)
        setTimeout(() => {}, delay)
        toast({
          title: "خطأ في تسجيل الدخول",
          description: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ في الاتصال بالخادم",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <h2 className="text-2xl font-bold text-center">تسجيل الدخول</h2>
          <p className="text-sm text-muted-foreground text-center">
            أدخل بيانات الدخول للوصول إلى لوحة التحكم
          </p>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleLogin} className="space-y-4">
            <div style={{ position: "absolute", left: "-9999px", opacity: 0 }} aria-hidden="true">
              <Label htmlFor="website">Website</Label>
              <input
                ref={honeypotRef}
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="text"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
                autoComplete="email"
                maxLength={254}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
                autoComplete="current-password"
                maxLength={128}
              />
            </div>
            {failedAttempts >= 3 && (
              <p className="text-xs text-destructive text-center">
                تم تجاوز عدد المحاولات المسموح بها. يرجى الانتظار قبل المحاولة مرة أخرى.
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || failedAttempts >= 5}
            >
              {isLoading ? "جاري تسجيل الدخول..." : failedAttempts >= 5 ? "مقفل مؤقتاً" : "تسجيل الدخول"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
