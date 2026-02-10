"use client";
import React, { createContext, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit-react';

interface AuthContextType {
    signOut: () => void;
    user: { address: string; label?: string | null } | null;
    isConnected: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const currentAccount = useCurrentAccount();
    const router = useRouter();

    const signOut = () => {
        // Disconnect functionality is managed by the wallet extension or ConnectButton.
        // Programmatic disconnect seems unavailable in this SDK version.
        router.push('/auth/login');
    };

    const user = currentAccount ? { address: currentAccount.address, label: currentAccount.label } : null;

    return (
        <AuthContext.Provider value={{ signOut, user, isConnected: !!currentAccount }}>
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