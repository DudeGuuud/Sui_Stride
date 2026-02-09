"use client";

import { AuthProvider } from "@/context/auth";
import { RouteGuard } from "@/components/route-guard";
import { createNetworkConfig, SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";

const { networkConfig } = createNetworkConfig({
  testnet: { url: process.env.NEXT_PUBLIC_SUI_TESTNET_URL },
  mainnet: { url: process.env.NEXT_PUBLIC_SUI_MAINNET_URL },
});

const queryClient = new QueryClient();

// Custom client factory for gRPC
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createClient = (name: string, config: { url: string }) => {
  return new SuiGrpcClient({
    network: name as any,
    baseUrl: config.url,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any; // Cast as any because dapp-kit expects SuiClient (JSON-RPC)
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider 
        networks={networkConfig} 
        defaultNetwork="testnet"
        createClient={createClient}
      >
        <WalletProvider autoConnect>
          <AuthProvider>
            <RouteGuard>{children}</RouteGuard>
          </AuthProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
