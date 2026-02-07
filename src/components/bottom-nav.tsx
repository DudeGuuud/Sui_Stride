"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, User, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on specific pages
  if (
    pathname === "/auth/login" ||
    pathname === "/auth/register" ||
    pathname.startsWith("/workout")
  ) {
    return null;
  }

  const tabs = [
    { name: "Home", href: "/", icon: Home },
    { name: "Pools", href: "/pools", icon: Target },
    { name: "Ranks", href: "/ranks", icon: Trophy },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-20 pb-4">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={24} className={cn(isActive && "fill-primary/20")} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
