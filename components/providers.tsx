"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import LoginForm from "@/components/login-form"
import DashboardHeader from "@/components/dashboard-header"
import { useState, useEffect } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsLoading(false)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="theme"
    >
      {isLoading ? null : (
        <>
          {isLoggedIn && <DashboardHeader setIsLoggedIn={setIsLoggedIn} />}
          {isLoggedIn ? children : <LoginForm setIsLoggedIn={setIsLoggedIn} />}
        </>
      )}
      <Toaster />
    </ThemeProvider>
  )
} 