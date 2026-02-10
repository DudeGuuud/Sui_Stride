"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth";
import { Loader2 } from "lucide-react";

const publicRoutes = ["/auth/login", "/auth/register", "/auth/callback"];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Check if user is authenticated
    if (!user && !publicRoutes.includes(pathname)) {
      router.push("/auth/login");
    } else if (user && publicRoutes.includes(pathname)) {
      // Redirect authenticated users away from public routes
      // Exception: allow callback to finish its logic which manually redirects
      if (pathname !== "/auth/callback") {
        router.push("/");
      }
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return <>{children}</>;
}
