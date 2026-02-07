"use client";
import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    signIn: () => void;
    signInWithGoogle: () => Promise<void>;
    signOut: () => void;
    user: { name: string } | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<{ name: string } | null>(null);
    const router = useRouter();

    const signIn = () => {
        // Mock login
        setUser({ name: 'Mock User' });
        router.push('/');
    };

    const signInWithGoogle = async () => {
        // Mock Google login behavior
        console.log("Mock Google Login initiated");
        setTimeout(() => {
            signIn();
        }, 1000);
    };

    const signOut = () => {
        setUser(null);
        router.push('/auth/login');
    };

    return (
        <AuthContext.Provider value={{ signIn, signInWithGoogle, signOut, user }}>
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