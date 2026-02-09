"use client";

import React from "react";
import { AuthProvider } from "@/context/auth";
import { RouteGuard } from "@/components/route-guard";
import { createDAppKit, DAppKitProvider } from "@mysten/dapp-kit-react";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 1. Configure Networks & dAppKit Instance following official Next.js guide
const GRPC_URLS = {
  testnet: process.env.NEXT_PUBLIC_SUI_TESTNET_URL,
  mainnet: process.env.NEXT_PUBLIC_SUI_MAINNET_URL,
} as const;

const dappKit = createDAppKit({
  networks: ['testnet', 'mainnet'],
  defaultNetwork: 'testnet',
  autoConnect: true,
  createClient: (network) => {
    return new SuiGrpcClient({
      network: network as any,
      baseUrl: (GRPC_URLS as any)[network]
    });
  },
});

// Register types for hook type inference
declare module '@mysten/dapp-kit-react' {
  interface Register {
    dAppKit: typeof dappKit;
  }
}

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DAppKitProvider dAppKit={dappKit}>
        <AuthProvider>
          <RouteGuard>{children}</RouteGuard>
        </AuthProvider>
      </DAppKitProvider>
    </QueryClientProvider>
  );
}