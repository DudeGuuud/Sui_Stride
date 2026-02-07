"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface SettingsLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function SettingsLayout({ title, children }: SettingsLayoutProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <div className="px-4 py-4 flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-card hover:bg-card/80 transition-colors"
        >
          <ChevronLeft size={24} className="text-foreground" />
        </button>
        <span className="text-foreground text-lg font-bold">{title}</span>
      </div>
      <div className="flex-1 px-4 py-4">{children}</div>
    </div>
  );
}
