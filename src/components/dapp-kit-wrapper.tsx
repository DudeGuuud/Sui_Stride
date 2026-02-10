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
    console.log("[DAppKitWrapper] Initializing Enoki with API Key present:", !!enokiApiKey);
    
    // Only register Enoki if a real API key is provided
    if (enokiApiKey && !enokiApiKey.includes("placeholder")) {
      console.log("[DAppKitWrapper] Registering Enoki wallets...");
      const { unregister } = registerEnokiWallets({
        apiKey: enokiApiKey,
        providers: {
          google: { 
            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "placeholder_google_id",
            redirectUrl: window.location.origin,
          },
          facebook: { 
            clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID || "placeholder_facebook_id",
            redirectUrl: window.location.origin,
          },
          twitch: { 
            clientId: process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID || "placeholder_twitch_id",
            redirectUrl: window.location.origin,
          }
        },
        network: "testnet",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        client: enokiSuiClient as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      console.log("[DAppKitWrapper] Enoki wallets registered.");
      return () => unregister();
    } else {
      console.warn("[DAppKitWrapper] Enoki API Key missing or is placeholder. Skipping registration.");
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