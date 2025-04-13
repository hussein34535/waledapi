"use client"

import { ModeToggle } from "@/components/mode-toggle";
import { Server, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Dispatch, SetStateAction, ReactNode, useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

interface Props {
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
  children?: ReactNode;
}

export default function DashboardHeader({ setIsLoggedIn, children }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="bg-background py-4 border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl text-foreground">VPS Manager</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Admin Dashboard
            </span>
            <ModeToggle />
            {setIsLoggedIn && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsLoggedIn(false);
                }}
              >
                Logout
              </Button>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center space-x-2">
            <ModeToggle />
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col space-y-4 mt-4">
                  <span className="text-sm text-muted-foreground">
                    Admin Dashboard
                  </span>
                  {setIsLoggedIn && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setIsLoggedIn(false);
                        setIsMenuOpen(false);
                      }}
                    >
                      Logout
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
