"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit-react';
import { enokiFlow } from '@/lib/enoki';

import { SuiGrpcClient } from '@mysten/sui/grpc';

interface AuthContextType {
    signOut: () => void;
    user: { address: string; label?: string | null } | null;
    isConnected: boolean;
    userDataId: string | null;
    refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PACKAGE_ID = process.env.NEXT_PUBLIC_SUI_PACKAGE_ID;
const RPC_URL = process.env.NEXT_PUBLIC_SUI_TESTNET_URL || 'https://fullnode.testnet.sui.io:443';
const suiClient = new SuiGrpcClient({ baseUrl: RPC_URL, network: 'testnet' });

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const currentAccount = useCurrentAccount();
    const router = useRouter();
    const [zkSession, setZkSession] = useState<{ jwt: string; address: string } | null>(null);
    const [userDataId, setUserDataId] = useState<string | null>(null);

    const refreshUserData = useCallback(async () => {
        const address = currentAccount?.address || zkSession?.address;
        if (!address || !PACKAGE_ID) {
            setUserDataId(null);
            return;
        }

        try {
            const result = await suiClient.listOwnedObjects({
                owner: address,
                type: `${PACKAGE_ID}::core::UserData`,
                include: { content: true }
            });

            if (result.objects.length > 0) {
                setUserDataId(result.objects[0].objectId || null);
            } else {
                setUserDataId(null);
            }
        } catch (e) {
            console.error("Error fetching UserData:", e);
            setUserDataId(null);
        }
    }, [currentAccount?.address, zkSession?.address]);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const session = await enokiFlow.getSession();
                if (session && session.jwt) {
                    const keypair = await enokiFlow.getKeypair();
                    const address = keypair.toSuiAddress();
                    setZkSession({ jwt: session.jwt, address });
                } else {
                    setZkSession(null);
                }
            } catch (e) {
                console.error("Failed to check Enoki session:", e);
                setZkSession(null);
            }
        };
        
        checkSession();
        
        const handleStorageChange = () => checkSession();
        window.addEventListener('storage', handleStorageChange);
        
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Refresh UserData when account changes - using an effect that only runs when addresses change
    const accountAddress = currentAccount?.address;
    const zkAddress = zkSession?.address;
    
    useEffect(() => {
        if (accountAddress || zkAddress) {
            // Use an async function wrapper to avoid direct synchronous setState call if needed, 
            // though refreshUserData is already async. The error is likely due to how it's called.
            const run = async () => {
                await refreshUserData();
            };
            run();
        }
    }, [accountAddress, zkAddress, refreshUserData]);

    const signOut = async () => {
        if (zkSession) {
            await enokiFlow.logout();
            setZkSession(null);
            setUserDataId(null);
            router.push('/auth/login');
        } else {
            setUserDataId(null);
            router.push('/auth/login');
        }
    };

    const user = currentAccount 
        ? { address: currentAccount.address, label: currentAccount.label } 
        : zkSession 
            ? { address: zkSession.address, label: 'Google User' } 
            : null;

    const isConnected = !!currentAccount || !!zkSession;

    return (
        <AuthContext.Provider value={{ signOut, user, isConnected, userDataId, refreshUserData }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}