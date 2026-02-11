"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { enokiFlow } from "@/lib/enoki";
import { useAuth } from "@/context/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
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
        
        await refreshSession();
        router.push("/");
      } catch (error) {
        console.error("Error handling Enoki auth callback:", error);
        
        // Check if we are in System Browser (Native Flow)
        // If error (likely missing session key) and we have a hash or search params
        if (window.location.hash || window.location.search) {
           const params = new URLSearchParams(window.location.search);
           const state = params.get('state');

           // If we have a dynamic redirect URL in state (from Native App via LoginPage), use it.
           // This handles Expo Go (exp://) and Production (suistride://) seamlessly.
           if (state && (state.startsWith('exp://') || state.startsWith('suistride://'))) {
               console.log("Redirecting to dynamic Native App URL:", state);
               // Reconstruct full URL to pass back to app
               const redirectUrl = `${state}${window.location.search}${window.location.hash}`;
               window.location.href = redirectUrl;
               return;
           }

           console.log("Attempting fallback relay to native app...");
           // Fallback to hardcoded scheme if no state provided (might fail in Expo Go Tunnel)
           const deepLink = `suistride://auth-callback${window.location.search}${window.location.hash}`;
           window.location.href = deepLink;
           
           return; 
        }

        router.push("/auth/login");
      }
    }

    handleCallback();
  }, [router, refreshSession]);

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