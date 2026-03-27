'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

interface AuthContextType {
    isLoggedIn: boolean;
    isLoading: boolean;
    login: () => void;
    logout: () => void;
    showLoading: (message?: string, duration?: number) => void;
    setLoadingState: (state: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);

    useEffect(() => {
        setIsMounted(true);
        const storedLoginState = localStorage.getItem('astranavi_logged_in');
        if (storedLoginState === 'true') {
            setIsLoggedIn(true);
        }
    }, []);

    const login = () => {
        setIsLoggedIn(true);
        localStorage.setItem('astranavi_logged_in', 'true');
    };

    const logout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem('astranavi_logged_in');
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
        <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout, showLoading, setLoadingState }}>
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
