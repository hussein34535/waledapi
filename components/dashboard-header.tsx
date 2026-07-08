"use client"

import { LogOut, Sun, Moon } from "lucide-react";
import { ReactNode } from "react";
import { useTheme } from "next-themes";

interface Props {
  onLogout: () => void;
  children?: ReactNode;
}

export default function DashboardHeader({ onLogout, children }: Props) {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-nav bg-background/80 backdrop-blur-2xl border-t border-border/50 safe-area-bottom">
        <div className="flex items-center justify-between h-full max-w-lg mx-auto px-6">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground transition-colors active:scale-90"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            onClick={onLogout}
            className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground/60 hover:text-destructive transition-colors active:scale-90"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <div className="pb-nav">
        {children}
      </div>
    </>
  );
}
