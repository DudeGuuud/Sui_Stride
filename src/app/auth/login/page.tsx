"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { ConnectButton } from "@mysten/dapp-kit-react";
import { enokiFlow } from "@/lib/enoki";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
} as const;

export default function LoginPage() {
  const { isConnected, refreshSession } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [nativeRedirectUrl, setNativeRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  // Request native redirect URL on mount
  useEffect(() => {
    if (window.ReactNativeWebView) {
      console.log("Requesting Native Redirect URL...");
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'GET_REDIRECT_URL'
      }));
    }
  }, []);

  useEffect(() => {
    // Listen for AUTH_RESULT or SET_REDIRECT_URL from Native App
    const handleMessage = async (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.type === 'AUTH_RESULT' && data.url) {
          console.log("Received Auth Result from Native:", data.url);
          setIsLoading(true);
          await enokiFlow.handleAuthCallback(data.url);
          await refreshSession();
          router.push('/');
        }
        
        if (data.type === 'SET_REDIRECT_URL' && data.url) {
          console.log("Received Native Redirect URL:", data.url);
          setNativeRedirectUrl(data.url);
        }
      } catch (e) {
        console.error("Error handling native message:", e);
        setIsLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    document.addEventListener("message", handleMessage as any);

    return () => {
      window.removeEventListener("message", handleMessage);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      document.removeEventListener("message", handleMessage as any);
    }
  }, [refreshSession, router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const redirectUrl = `${appUrl}/auth/callback`;
      
      console.log("Constructed Redirect URL:", redirectUrl);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const extraParams: any = {
        scope: ['openid', 'email', 'profile'],
      };
      
      // If we have a native redirect URL, pass it in the state param to Google
      // so it comes back to the callback page
      if (nativeRedirectUrl) {
        console.log("Passing Native Redirect URL in state:", nativeRedirectUrl);
        extraParams.state = nativeRedirectUrl;
      } else if (window.ReactNativeWebView) {
        console.warn("Native environment detected but no redirect URL received yet. Login might fail to redirect back.");
      }

      let url = await enokiFlow.createAuthorizationURL({
        provider: 'google',
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        redirectUrl: redirectUrl,
        network: 'testnet',
        extraParams,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      
      // Fallback: If Enoki ignored our state param, manually append it to the URL
      if (nativeRedirectUrl && !url.includes('state=')) {
         console.log("Enoki missing state param, appending manually...");
         const separator = url.includes('?') ? '&' : '?';
         url = `${url}${separator}state=${encodeURIComponent(nativeRedirectUrl)}`;
      }
      
      // Force direct navigation in WebView (User Agent spoofing handles the rest)
      window.location.href = url;

    } catch (error) {
      console.error("Google login error:", error);
      setIsLoading(false);
      alert("Failed to initialize Google login. Check console for details.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background p-6">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex-1 flex flex-col"
        >
          {/* Logo & Branding */}
          <div className="items-center mt-12 mb-10 flex flex-col">
            <motion.div
              variants={itemVariants}
              className="w-24 h-24 rounded-[28px] bg-card flex items-center justify-center overflow-hidden border-2 border-primary/20 shadow-2xl shadow-primary/10"
            >
              <Image
                src="/images/logo.png"
                alt="SuiStride Logo"
                width={96}
                height={96}
                className="w-full h-full object-cover"
                priority
              />
            </motion.div>
            <motion.h1
              variants={itemVariants}
              className="text-foreground text-3xl font-black mt-6 tracking-tight"
            >
              SuiStride
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-muted-foreground text-sm font-medium mt-1 uppercase tracking-[3px]"
            >
              Next-Gen Fitness
            </motion.p>
          </div>

          {/* Social / zkLogin Section */}
          <motion.div variants={itemVariants} className="mb-8 w-full">
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest text-center mb-6">
              Log in with zkLogin
            </p>
            <div className="flex flex-col gap-6 mb-4">
              <Button 
                variant="outline" 
                className="w-full h-16 rounded-[24px] border-border/50 bg-card hover:bg-card/80 flex items-center gap-4 justify-center shadow-xl shadow-primary/5 group transition-all duration-300"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                 <Chrome size={24} className="group-hover:scale-110 transition-transform" />
                 <span className="text-lg font-black uppercase tracking-tight">Sign in with Google</span>
              </Button>
              
              <div className="flex items-center gap-4 w-full">
                <div className="flex-1 h-[1px] bg-border/30" />
                <span className="text-muted-foreground text-[10px] font-black uppercase tracking-tighter">
                  OR
                </span>
                <div className="flex-1 h-[1px] bg-border/30" />
              </div>

              <div className="bg-card/30 border border-border/30 rounded-[24px] p-6 text-center backdrop-blur-sm">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[2px] mb-4">
                  Or use a native wallet
                </p>
                <div className="flex justify-center">
                  <ConnectButton 
                    className="!w-full !h-12 !rounded-xl !border-border/50 !bg-card hover:!bg-card/80 !text-sm !font-bold !transition-all !duration-300 shadow-lg shadow-primary/5"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex justify-center gap-2 mt-auto mb-10"
          >
            <span className="text-muted-foreground text-sm">
              New to SuiStride?
            </span>
            <Link href="/auth/register" className="text-primary text-sm font-bold hover:underline">
              Get Started
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
