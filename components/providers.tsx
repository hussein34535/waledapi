"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider, useAuth } from "@/components/auth-provider"
import LoginForm from "@/components/login-form"
import DashboardHeader from "@/components/dashboard-header"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Suspense } from "react"

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return null

  return (
    <>
      {user ? (
        <Suspense fallback={null}>
          <DashboardHeader onLogout={() => signOut(auth)}>
            {children}
          </DashboardHeader>
        </Suspense>
      ) : (
        <LoginForm />
      )}
    </>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
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
