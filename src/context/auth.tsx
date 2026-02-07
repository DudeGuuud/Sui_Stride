"use client";
import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    signIn: () => void;
    signOut: () => void;
    user: any | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any | null>(null);
    const router = useRouter();

    const signIn = () => {
        setUser({ name: 'User' });
        router.push('/dashboard');
    };

    const signOut = () => {
        setUser(null);
        router.push('/auth/login');
    };

    return (
        <AuthContext.Provider value={{ signIn, signOut, user }}>
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
