"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth";

const publicRoutes = ["/auth/login", "/auth/register"];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is authenticated
    if (!user && !publicRoutes.includes(pathname)) {
      router.push("/auth/login");
    } else if (user && publicRoutes.includes(pathname)) {
      // Redirect authenticated users away from public routes
      router.push("/");
    }
  }, [user, pathname, router]);

  // Optionally show loading state here while checking auth
  return <>{children}</>;
}
