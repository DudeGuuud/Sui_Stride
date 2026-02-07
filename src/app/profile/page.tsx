"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronRight, CreditCard, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <div className="flex-1 px-4">
        <div className="items-center py-8 flex flex-col">
          <div className="w-24 h-24 rounded-full bg-muted mb-4 overflow-hidden border-2 border-primary relative">
            <Image
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"
              alt="Profile"
              fill
              className="object-cover"
            />
          </div>
          <h2 className="text-foreground text-2xl font-bold">Alex Stride</h2>
          <span className="text-muted-foreground text-sm font-medium">0x...A123</span>
        </div>

        <div className="flex flex-col gap-4">
          <Link href="/settings/security">
            <Card className="bg-card border-none hover:bg-card/80 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <Shield size={20} color="#00E5FF" />
                <span className="text-foreground font-medium flex-1">Security & Privacy</span>
                <ChevronRight size={16} color="#94A3B8" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings/wallet">
            <Card className="bg-card border-none hover:bg-card/80 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <CreditCard size={20} color="#00E5FF" />
                <span className="text-foreground font-medium flex-1">Wallet Management</span>
                <ChevronRight size={16} color="#94A3B8" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings/notifications">
            <Card className="bg-card border-none hover:bg-card/80 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <Bell size={20} color="#00E5FF" />
                <span className="text-foreground font-medium flex-1">Notifications</span>
                <ChevronRight size={16} color="#94A3B8" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
