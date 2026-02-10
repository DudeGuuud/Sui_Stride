"use client";

import React, { useEffect } from "react";
import { AuthProvider } from "@/context/auth";
import { RouteGuard } from "@/components/route-guard";
import { createDAppKit, DAppKitProvider } from "@mysten/dapp-kit-react";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { registerEnokiWallets } from "@mysten/enoki";

// 1. Configure Networks & dAppKit Instance
const GRPC_URLS = {
  testnet: process.env.NEXT_PUBLIC_SUI_TESTNET_URL || 'https://sui-testnet.grpc.mystenlabs.com:443',
  mainnet: process.env.NEXT_PUBLIC_SUI_MAINNET_URL || 'https://sui-mainnet.grpc.mystenlabs.com:443',
} as const;

type NetworkName = keyof typeof GRPC_URLS;

const dappKit = createDAppKit({
  networks: ['testnet', 'mainnet'],
  defaultNetwork: 'testnet',
  createClient: (network) => {
    return new SuiGrpcClient({ 
      network: network as 'testnet' | 'mainnet', 
      baseUrl: GRPC_URLS[network as NetworkName] 
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

export function DAppKitWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Create a client instance for Enoki wallet
    const enokiSuiClient = new SuiGrpcClient({
      network: 'testnet',
      baseUrl: GRPC_URLS.testnet
    });

    const enokiApiKey = process.env.NEXT_PUBLIC_ENOKI_PUBLIC_KEY;
    
    // Only register Enoki if a real API key is provided
    if (enokiApiKey && !enokiApiKey.includes("placeholder")) {
      const { unregister } = registerEnokiWallets({
        apiKey: enokiApiKey,
        providers: {
          google: { clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "placeholder_google_id" },
          facebook: { clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID || "placeholder_facebook_id" },
          twitch: { clientId: process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID || "placeholder_twitch_id" }
        },
        network: "testnet",
        client: enokiSuiClient as any // Cast to satisfy type if strict checking complains about specific client interface
      });
      return () => unregister();
    }
  }, []);

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