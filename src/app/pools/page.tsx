"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, HelpCircle, Coins, Users, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import CreatePoolDrawer from "@/components/create-pool-drawer";
import { AnimatePresence } from "framer-motion";

export default function PoolsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Global");
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  const challenges = [
    {
      id: 1,
      title: "5km Sprint",
      pool: "5,000 SUI",
      participants: 128,
      timeLeft: "04h 22m",
      badge: "LIVE NOW",
      badgeVariant: "bg-secondary text-secondary-foreground",
      image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=400&fit=crop",
    },
    {
      id: 2,
      title: "Morning Cycling",
      pool: "12,500 SUI",
      participants: 85,
      timeLeft: "12h 05m",
      badge: "POPULAR",
      badgeVariant: "bg-primary text-primary-foreground",
      image: "https://images.unsplash.com/photo-1541625602330-2277a1cd1f59?w=800&h=400&fit=crop",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24 relative">
      {/* Header */}
      <div className="px-4 py-4 flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-card hover:bg-card/80 transition-colors"
        >
          <ChevronLeft size={24} className="text-foreground" />
        </button>
        <span className="text-foreground text-lg font-bold">Stake-to-Win</span>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-card hover:bg-card/80 transition-colors">
          <HelpCircle size={24} className="text-foreground" />
        </button>
      </div>

      <div className="flex-1 px-4">
        <div className="mt-2 mb-6">
          <div className="flex items-baseline gap-2 mb-4">
            <h1 className="text-primary text-4xl font-bold">Active</h1>
            <span className="text-muted-foreground text-2xl font-medium">Pools</span>
          </div>

          {/* Segmented Control */}
          <div className="flex bg-card p-1 rounded-xl mb-6">
            {["Global", "Friends"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-2.5 flex items-center justify-center rounded-lg transition-all text-sm font-semibold",
                  activeTab === tab
                    ? "bg-muted shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Challenge Cards */}
          {activeTab === "Global" ? (
            challenges.map((challenge) => (
              <Card key={challenge.id} className="bg-card border-none mb-6 overflow-hidden shadow-lg shadow-black/20">
                <div className="relative h-48 w-full">
                  <Image
                    src={challenge.image}
                    alt={challenge.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm", challenge.badgeVariant)}>
                      {challenge.badge}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-black/20" />
                </div>

                <CardContent className="p-5">
                  <div className="flex justify-between items-end gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-foreground text-xl font-bold mb-2 truncate">{challenge.title}</h3>
                      <div className="flex items-center gap-1.5 mb-3">
                        <Coins size={16} color="#00E5FF" />
                        <span className="text-primary font-bold">Pool: {challenge.pool}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users size={14} className="text-muted-foreground" />
                          <span className="text-muted-foreground text-xs">{challenge.participants} Participants</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} className="text-muted-foreground" />
                          <span className="text-muted-foreground text-xs">{challenge.timeLeft} left</span>
                        </div>
                      </div>
                    </div>

                    <Button className="h-10 px-6 rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity shrink-0">
                      <span className="text-[#0A0E12] font-bold">JOIN</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="flex flex-col gap-6 items-center justify-center py-10 text-muted-foreground">
                <p>No active friend challenges.</p>
                <Button variant="outline">Invite Friends</Button>
            </div>
          )}
        </div>
      </div>

      {/* FAB - Create Pool */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center z-40 pointer-events-none">
        <button
          onClick={() => setIsCreateDrawerOpen(true)}
          className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-[0_8px_30px_rgb(0,229,255,0.4)] pointer-events-auto hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus size={32} className="text-[#0A0E12]" strokeWidth={3} />
        </button>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {isCreateDrawerOpen && (
          <CreatePoolDrawer 
            isOpen={isCreateDrawerOpen} 
            onClose={() => setIsCreateDrawerOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}