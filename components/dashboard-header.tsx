"use client"

"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { LogOut, Sun, Moon, Server, Globe } from "lucide-react";
import { ReactNode } from "react";
import { useTheme } from "next-themes";

interface Props {
  onLogout: () => void;
  children?: ReactNode;
}

export default function DashboardHeader({ onLogout, children }: Props) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section = searchParams.get("s");

  const navItems = [
    { icon: Server, label: "Accounts", href: "/dashboard" },
    { icon: Globe, label: "SNI", href: "/dashboard?s=sni" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" && !section;
    return pathname === "/dashboard" && section === "sni";
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-nav bg-background/80 backdrop-blur-2xl border-t border-border/50 safe-area-bottom">
        <div className="flex items-center justify-around h-full max-w-lg mx-auto px-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex flex-col items-center justify-center w-12 h-10 rounded-xl text-muted-foreground hover:text-foreground transition-colors active:scale-90"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          {navItems.map(({ icon: Icon, label, href }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`flex flex-col items-center justify-center w-16 h-10 rounded-xl transition-all duration-300 active:scale-90 ${
                isActive(href)
                  ? "text-primary"
                  : "text-muted-foreground/60 hover:text-muted-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {isActive(href) && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-status-pulse" />
                )}
              </div>
            </button>
          ))}
          <button
            onClick={onLogout}
            className="flex flex-col items-center justify-center w-12 h-10 rounded-xl text-muted-foreground/60 hover:text-destructive transition-colors active:scale-90"
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
