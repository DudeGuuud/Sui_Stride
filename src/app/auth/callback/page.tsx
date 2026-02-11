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
        // It requires the ephemeral key to be in storage.
        // If this is running in the System Browser (Native Flow), storage is empty.
        // If running in WebView (Web Flow or Native result), storage has the key.
        
        // We attempt to handle it.
        await enokiFlow.handleAuthCallback();
        console.log("Enoki auth callback handled successfully.");
        
        await refreshSession();
        router.push("/");
      } catch (error) {
        console.error("Error handling Enoki auth callback:", error);
        
        // If error (likely missing session key) and we have a hash,
        // we might be in the System Browser. Try relaying to Native App.
        if (window.location.hash) {
           console.log("Attempting to relay to native app...");
           // Construct deep link with the same hash
           // We use the scheme defined in app.json
           const deepLink = `suistride://auth-callback${window.location.search}${window.location.hash}`;
           window.location.href = deepLink;
           
           // Show a message to the user
           return; // Stay on page (or show "Return to App")
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