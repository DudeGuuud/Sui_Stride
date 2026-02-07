"use client";

import { AuthProvider } from "@/context/auth";
import { RouteGuard } from "@/components/route-guard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RouteGuard>{children}</RouteGuard>
    </AuthProvider>
  );
}