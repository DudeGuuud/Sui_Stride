import React, { createContext, useContext, useState, useEffect } from 'react';

type AuthContextType = {
  user: any | null;
  signIn: () => void;
  signOut: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  signIn: () => {},
  signOut: () => {},
  isLoading: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock sign-in function
  const signIn = () => {
    setIsLoading(true);
    // Simulate network request if needed, or just set user immediately
    // The UI components handle the "visual" loading delay.
    // Here we just set the state.
    setUser({ name: 'User' }); 
    setIsLoading(false);
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
