"use client";

import React from "react";
import SettingsLayout from "@/components/settings-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";

export default function WalletPage() {
  return (
    <SettingsLayout title="Wallet Management">
      <div className="flex flex-col gap-6">
        <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/20">
          <CardContent className="p-6">
            <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1 block">
              Total Balance
            </span>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-foreground text-4xl font-bold">1,240.50</span>
              <span className="text-primary text-xl font-bold">SUI</span>
            </div>
            <div className="flex items-center gap-2 bg-background/50 p-2 rounded-lg border border-border/50">
              <span className="text-muted-foreground text-xs font-mono flex-1 truncate">
                0x71C...9A23
              </span>
              <button className="p-1 hover:bg-background rounded">
                <Copy size={14} className="text-foreground" />
              </button>
            </div>
          </CardContent>
        </Card>

        <section>
          <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-3">
            Connected Wallets
          </h3>
          <Card className="bg-card border-none">
            <CardContent className="p-4 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-foreground font-medium">Sui Wallet</span>
                  <span className="text-muted-foreground text-xs">Active</span>
                </div>
                <Button variant="outline" size="sm">
                  Disconnect
                </Button>
              </div>
              <div className="h-[1px] bg-border/50" />
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-foreground font-medium">zkLogin (Google)</span>
                  <span className="text-muted-foreground text-xs">Linked</span>
                </div>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
            <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-3">
                Transaction History
            </h3>
            <Button variant="outline" className="w-full flex gap-2">
                View on Sui Explorer
                <ExternalLink size={16} />
            </Button>
        </section>
      </div>
    </SettingsLayout>
  );
}
