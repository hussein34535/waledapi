"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider, useAuth } from "@/components/auth-provider"
import LoginForm from "@/components/login-form"
import DashboardHeader from "@/components/dashboard-header"
import { useState } from "react"

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  if (loading) {
    return null
  }

  const authenticated = !!(user || isLoggedIn)

  return (
    <>
      {authenticated && <DashboardHeader setIsLoggedIn={setIsLoggedIn} />}
      {authenticated ? children : <LoginForm setIsLoggedIn={setIsLoggedIn} />}
    </>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="theme"
    >
      <AuthProvider>
        <AuthGate>{children}</AuthGate>
      </AuthProvider>
      <Toaster />
    </ThemeProvider>
  )
}
