"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function RanksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <div className="flex-1 px-4">
        <div className="py-6">
          <h1 className="text-foreground text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground text-base mb-6">Top performers this week</p>

          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="bg-card border-none mb-4 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <span className="text-primary font-bold text-lg w-6">#{i}</span>
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                    U{i}
                </div>
                <div className="flex-1">
                  <div className="text-foreground font-bold">User {i}</div>
                  <div className="text-muted-foreground text-xs">245.5 km</div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-secondary font-bold">4,200 pts</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
