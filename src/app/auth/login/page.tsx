"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Chrome, Github, Lock, Mail, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/utils";

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
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (provider: string) => {
    setIsLoading(true);
    // Mock network delay for effect
    setTimeout(() => {
      signIn();
      // The router push is handled inside signIn context usually, but here we can rely on it.
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
            <div className="flex gap-4 mb-4">
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-2xl border-border/50 bg-card/50 flex gap-3 hover:bg-card/80"
                onClick={() => handleLogin("google")}
                disabled={isLoading}
              >
                <Chrome size={20} color="#EA4335" />
                <span className="text-foreground font-bold">Google</span>
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-2xl border-border/50 bg-card/50 flex gap-3 hover:bg-card/80"
                disabled={isLoading}
              >
                <Github size={20} className="text-foreground" />
                <span className="text-foreground font-bold">Github</span>
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full h-14 rounded-2xl border-primary/30 bg-primary/5 flex gap-3 mb-6 hover:bg-primary/10"
              onClick={() => handleLogin("sui")}
              disabled={isLoading}
            >
              <Wallet size={20} color="#00E5FF" />
              <span className="text-primary font-bold">Connect Sui Wallet</span>
            </Button>
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
              onClick={() => handleLogin("email")}
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
              Don't have an account?
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
