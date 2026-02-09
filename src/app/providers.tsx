"use client";

import dynamic from "next/dynamic";
import React from "react";

// Dynamically import the DAppKitWrapper with SSR disabled.
// This prevents the dApp Kit (which accesses window/localStorage) from running on the server.
const DAppKitWrapper = dynamic(
  () => import("@/components/dapp-kit-wrapper").then((mod) => mod.DAppKitWrapper),
  {
    ssr: false,
    loading: () => <div className="min-h-screen bg-background" />, // Simple loading state
  }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return <DAppKitWrapper>{children}</DAppKitWrapper>;
}