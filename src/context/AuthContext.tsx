'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

interface User {
    email: string;
    name?: string;
    dob?: string;
    tob?: string;
    pob?: string;
    phoneNumber?: string;
}

interface AuthContextType {
    isLoggedIn: boolean;
    isLoading: boolean;
    user: User | null;
    login: (email?: string, profile?: Partial<User>) => void;
    logout: () => void;
    showLoading: (message?: string, duration?: number) => void;
    setLoadingState: (state: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);

    useEffect(() => {
        setIsMounted(true);
        const storedLoginState = localStorage.getItem('astranavi_logged_in');
        const storedEmail = localStorage.getItem('astranavi_user_email');
        const storedName = localStorage.getItem('astranavi_user_name');
        
        if (storedLoginState === 'true') {
            setIsLoggedIn(true);
            setUser({ 
                email: storedEmail || 'seeker@cosmos.com',
                name: storedName || undefined,
                dob: localStorage.getItem('astranavi_user_dob') || undefined,
                tob: localStorage.getItem('astranavi_user_tob') || undefined,
                pob: localStorage.getItem('astranavi_user_pob') || undefined,
                phoneNumber: localStorage.getItem('astranavi_user_phone') || undefined,
            });
        }
    }, []);

    const login = (email: string = 'seeker@cosmos.com', profile?: Partial<User>) => {
        setIsLoggedIn(true);
        const newUser = { email, ...profile };
        setUser(newUser);
        
        localStorage.setItem('astranavi_logged_in', 'true');
        localStorage.setItem('astranavi_user_email', email);
        if (profile?.name) localStorage.setItem('astranavi_user_name', profile.name);
        if (profile?.dob) localStorage.setItem('astranavi_user_dob', profile.dob);
        if (profile?.tob) localStorage.setItem('astranavi_user_tob', profile.tob);
        if (profile?.pob) localStorage.setItem('astranavi_user_pob', profile.pob);
        if (profile?.phoneNumber) localStorage.setItem('astranavi_user_phone', profile.phoneNumber);
    };

    const logout = () => {
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem('astranavi_logged_in');
        localStorage.removeItem('astranavi_user_email');
        localStorage.removeItem('astranavi_user_name');
        localStorage.removeItem('astranavi_user_dob');
        localStorage.removeItem('astranavi_user_tob');
        localStorage.removeItem('astranavi_user_pob');
        localStorage.removeItem('astranavi_user_phone');
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
