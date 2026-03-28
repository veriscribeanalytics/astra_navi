'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

interface AuthContextType {
    isLoggedIn: boolean;
    isLoading: boolean;
    user: { email: string } | null;
    login: (email?: string) => void;
    logout: () => void;
    showLoading: (message?: string, duration?: number) => void;
    setLoadingState: (state: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<{ email: string } | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);

    useEffect(() => {
        setIsMounted(true);
        const storedLoginState = localStorage.getItem('astranavi_logged_in');
        const storedEmail = localStorage.getItem('astranavi_user_email');
        if (storedLoginState === 'true') {
            setIsLoggedIn(true);
            setUser(storedEmail ? { email: storedEmail } : { email: 'seeker@cosmos.com' });
        }
    }, []);

    const login = (email: string = 'seeker@cosmos.com') => {
        setIsLoggedIn(true);
        setUser({ email });
        localStorage.setItem('astranavi_logged_in', 'true');
        localStorage.setItem('astranavi_user_email', email);
    };

    const logout = () => {
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem('astranavi_logged_in');
        localStorage.removeItem('astranavi_user_email');
    };

    const showLoading = (message?: string, duration: number = 2000) => {
        setLoadingMessage(message);
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
        }, duration);
    };

    const setLoadingState = (state: boolean) => setIsLoading(state);

    if (!isMounted) return null;

    return (
        <AuthContext.Provider value={{ isLoggedIn, isLoading, user, login, logout, showLoading, setLoadingState }}>
            {children}
            <LoadingOverlay isVisible={isLoading} message={loadingMessage} />
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
