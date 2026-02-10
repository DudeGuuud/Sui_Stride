"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Chrome, Github, Lock, Mail, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const { isConnected } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const protocol = window.location.protocol;
      const host = window.location.host;
      const redirectUrl = `${protocol}//${host}/auth/callback`;
      
      const url = await enokiFlow.createAuthorizationURL({
        provider: 'google',
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        redirectUrl: redirectUrl,
        network: 'testnet',
        extraParams: {
          scope: ['openid', 'email', 'profile'],
        },
      });
      
      window.location.href = url;
    } catch (error) {
      console.error("Google login error:", error);
      setIsLoading(false);
      alert("Failed to initialize Google login. Check console for details.");
    }
  };

  const handleEmailLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert("Email login not implemented yet");
    }, 1500);
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
            <div className="flex flex-col gap-4 mb-4">
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl border-border/50 bg-card hover:bg-card/80 flex items-center gap-3 justify-center"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                 <Chrome size={20} />
                 <span className="font-bold">Sign in with Google</span>
              </Button>
              
              <div className="bg-card/50 border border-border/50 rounded-2xl p-4 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Or connect your Sui wallet directly
                </p>
                <div className="flex justify-center">
                  <ConnectButton className="w-full" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex items-center gap-4 mb-8 w-full"
          >
            <div className="flex-1 h-[1px] bg-border/30" />
            <span className="text-muted-foreground text-[10px] font-black uppercase">
              OR
            </span>
            <div className="flex-1 h-[1px] bg-border/30" />
          </motion.div>

          {/* Traditional Form */}
          <motion.div variants={itemVariants} className="flex flex-col gap-4 mb-8 w-full">
            <div className="bg-card border border-border/50 rounded-2xl px-4 py-1 flex items-center gap-3">
              <Mail size={18} color="#94A3B8" />
              <Input
                placeholder="Email Address"
                className="flex-1 text-foreground font-medium border-none bg-transparent shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoCapitalize="none"
                disabled={isLoading}
              />
            </div>
            <div className="bg-card border border-border/50 rounded-2xl px-4 py-1 flex items-center gap-3">
              <Lock size={18} color="#94A3B8" />
              <Input
                placeholder="Password"
                className="flex-1 text-foreground font-medium border-none bg-transparent shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="text-primary text-xs font-bold hover:underline"
                disabled={isLoading}
              >
                Forgot Password?
              </button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="w-full">
            <Button
              className="w-full h-16 rounded-[24px] bg-primary shadow-xl shadow-primary/30 mb-8 hover:bg-primary/90 text-[#0A0E12] text-lg font-black uppercase tracking-tight"
              onClick={handleEmailLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent text-[#0A0E12]" />
              ) : (
                "Login"
              )}
            </Button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex justify-center gap-2 mb-10"
          >
            <span className="text-muted-foreground text-sm">
              Don&apos;t have an account?
            </span>
            <Link href="/auth/register" className="text-primary text-sm font-bold hover:underline">
              Sign Up
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}