"use client";

import React from "react";
import SettingsLayout from "@/components/settings-layout";
import { Card, CardContent } from "@/components/ui/card";

export default function NotificationsPage() {
  return (
    <SettingsLayout title="Notifications">
      <div className="flex flex-col gap-6">
        <section>
          <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-3">
            Push Notifications
          </h3>
          <Card className="bg-card border-none">
            <CardContent className="p-4 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-foreground font-medium">Workout Reminders</span>
                <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-background rounded-full absolute top-1 right-1" />
                </div>
              </div>
              <div className="h-[1px] bg-border/50" />
              <div className="flex justify-between items-center">
                <span className="text-foreground font-medium">Challenge Updates</span>
                <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-background rounded-full absolute top-1 right-1" />
                </div>
              </div>
              <div className="h-[1px] bg-border/50" />
              <div className="flex justify-between items-center">
                <span className="text-foreground font-medium">Friend Activity</span>
                <div className="w-10 h-6 bg-muted rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-muted-foreground/50 rounded-full absolute top-1 left-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-3">
            Email Notifications
          </h3>
          <Card className="bg-card border-none">
            <CardContent className="p-4 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-foreground font-medium">Weekly Digest</span>
                <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-background rounded-full absolute top-1 right-1" />
                </div>
              </div>
              <div className="h-[1px] bg-border/50" />
              <div className="flex justify-between items-center">
                <span className="text-foreground font-medium">Marketing Updates</span>
                <div className="w-10 h-6 bg-muted rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-muted-foreground/50 rounded-full absolute top-1 left-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </SettingsLayout>
  );
}
