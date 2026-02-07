"use client";

import React from "react";
import SettingsLayout from "@/components/settings-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SecurityPage() {
  return (
    <SettingsLayout title="Security & Privacy">
      <div className="flex flex-col gap-6">
        <section>
          <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-3">
            Authentication
          </h3>
          <Card className="bg-card border-none">
            <CardContent className="p-4 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-foreground font-medium">Biometric Login</span>
                <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-background rounded-full absolute top-1 right-1" />
                </div>
              </div>
              <div className="h-[1px] bg-border/50" />
              <div className="flex justify-between items-center">
                <span className="text-foreground font-medium">Two-Factor Auth</span>
                <span className="text-muted-foreground text-sm">Disabled</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-3">
            Data Privacy
          </h3>
          <Card className="bg-card border-none">
            <CardContent className="p-4 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-foreground font-medium">Share Location Data</span>
                <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-background rounded-full absolute top-1 right-1" />
                </div>
              </div>
              <div className="h-[1px] bg-border/50" />
              <div className="flex justify-between items-center">
                <span className="text-foreground font-medium">Public Profile</span>
                <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-background rounded-full absolute top-1 right-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Button variant="destructive" className="mt-4">
          Delete Account
        </Button>
      </div>
    </SettingsLayout>
  );
}
