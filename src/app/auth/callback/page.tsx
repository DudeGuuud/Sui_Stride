"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { enokiFlow } from "@/lib/enoki";

export default function AuthCallbackPage() {
  const router = useRouter();
  const handledRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in strict mode
    if (handledRef.current) return;
    handledRef.current = true;

    async function handleCallback() {
      try {
        // Enoki SDK automatically parses the hash from window.location
        await enokiFlow.handleAuthCallback();
        console.log("Enoki auth callback handled successfully.");
        router.push("/");
      } catch (error) {
        console.error("Error handling Enoki auth callback:", error);
        // On error, still try to go home or login, but logging the error is crucial
        // router.push("/auth/login");
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Authenticating...</h2>
        <p className="text-muted-foreground">Please wait while we complete your login.</p>
        <div className="mt-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
      </div>
    </div>
  );
}
