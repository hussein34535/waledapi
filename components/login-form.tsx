"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Server, Eye, EyeOff, ArrowLeft } from "lucide-react"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const router = useRouter()
  const { toast } = useToast()
  const honeypotRef = useRef<HTMLInputElement>(null)
  const startTimeRef = useRef(Date.now())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    startTimeRef.current = Date.now()
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (honeypotRef.current?.value) return

    const elapsed = Date.now() - startTimeRef.current
    if (elapsed < 2000) {
      toast({ title: "خطأ", description: "يرجى الانتظار قليلاً قبل المحاولة", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, honeypot: "", timestamp: String(Date.now()) }),
      })
      if (!response.ok) {
        setFailedAttempts((p) => p + 1)
        toast({ title: "خطأ في تسجيل الدخول", description: "البريد الإلكتروني أو كلمة المرور غير صحيحة", variant: "destructive" })
        setIsLoading(false)
        return
      }

      await signInWithEmailAndPassword(auth, email, password)
      setFailedAttempts(0)
      router.push("/dashboard")
    } catch {
      toast({ title: "خطأ في الاتصال", description: "حدث خطأ في الاتصال بالخادم", variant: "destructive" })
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl animate-float" />
      <div className="absolute bottom-1/3 left-1/4 h-48 w-48 rounded-full bg-violet-500/5 blur-3xl animate-float-delayed" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className="mb-8 text-center animate-slide-up">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20 animate-float">
            <Server className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">VPS Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">تسجيل الدخول للوحة التحكم</p>
        </div>

        <form onSubmit={handleLogin} className="w-full max-w-sm animate-slide-up stagger-2">
          <div style={{ position: "absolute", left: "-9999px", opacity: 0 }} aria-hidden="true">
            <input ref={honeypotRef} id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="space-y-2 mb-4">
            <Label htmlFor="email" className="text-sm font-medium">البريد الإلكتروني</Label>
            <div className="relative">
              <Input
                id="email"
                type="text"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                maxLength={254}
                className="h-12 px-4 rounded-2xl bg-card border-border/60 text-base transition-all duration-200 focus:border-primary/50 focus:shadow-lg focus:shadow-primary/5 placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <Label htmlFor="password" className="text-sm font-medium">كلمة المرور</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                maxLength={128}
                className="h-12 px-4 pr-12 rounded-2xl bg-card border-border/60 text-base transition-all duration-200 focus:border-primary/50 focus:shadow-lg focus:shadow-primary/5 placeholder:text-muted-foreground/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {failedAttempts >= 3 && (
            <p className="text-xs text-destructive text-center mb-4 animate-slide-up">
              تم تجاوز عدد المحاولات المسموح بها. يرجى الانتظار.
            </p>
          )}

          <button
            type="button"
            onClick={async () => {
              if (!email) {
                toast({ title: "خطأ", description: "يرجى إدخال البريد الإلكتروني أولاً", variant: "destructive" })
                return
              }
              try {
                await sendPasswordResetEmail(auth, email)
                toast({ title: "تم الإرسال", description: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك" })
              } catch {
                toast({ title: "خطأ", description: "فشل إرسال رابط إعادة التعيين. تأكد من صحة البريد", variant: "destructive" })
              }
            }}
            className="text-xs text-primary/70 hover:text-primary mb-4 transition-colors w-full text-center"
          >
            نسيت كلمة المرور؟
          </button>

          <Button
            type="submit"
            disabled={isLoading || failedAttempts >= 5}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                جاري...
              </span>
            ) : failedAttempts >= 5 ? (
              "مقفل مؤقتاً"
            ) : (
              "تسجيل الدخول"
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground/50 mt-8 animate-slide-up stagger-4">
          VPS Management System v2.0
        </p>
      </div>
    </div>
  )
}
