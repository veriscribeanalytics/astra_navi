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
    moonSign?: string;
    sunSign?: string;
}

interface AuthContextType {
    isLoggedIn: boolean;
    isLoading: boolean;
    user: User | null;
    login: (email?: string, profile?: Partial<User>) => void;
    logout: () => void;
    showLoading: (message?: string, duration?: number) => void;
    setLoadingState: (state: boolean) => void;
    refreshUser: (updates: Partial<User>) => void;
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
        
        if (storedLoginState === 'true' && storedEmail) {
            setIsLoggedIn(true);
            // Set from localStorage first (instant, no flicker)
            setUser({ 
                email: storedEmail || 'seeker@cosmos.com',
                name: storedName || undefined,
                dob: localStorage.getItem('astranavi_user_dob') || undefined,
                tob: localStorage.getItem('astranavi_user_tob') || undefined,
                pob: localStorage.getItem('astranavi_user_pob') || undefined,
                phoneNumber: localStorage.getItem('astranavi_user_phone') || undefined,
                moonSign: localStorage.getItem('astranavi_user_moon_sign') || undefined,
                sunSign: localStorage.getItem('astranavi_user_sun_sign') || undefined,
            });

            // Then sync from DB to get any server-side updates (e.g. AI-detected signs)
            fetch(`/api/user/profile?email=${encodeURIComponent(storedEmail)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.user) {
                        const dbUser = data.user;
                        setUser(prev => ({ ...prev!, ...dbUser }));
                        // Sync back to localStorage
                        if (dbUser.moonSign) localStorage.setItem('astranavi_user_moon_sign', dbUser.moonSign);
                        if (dbUser.sunSign) localStorage.setItem('astranavi_user_sun_sign', dbUser.sunSign);
                        if (dbUser.name) localStorage.setItem('astranavi_user_name', dbUser.name);
                        if (dbUser.dob) localStorage.setItem('astranavi_user_dob', dbUser.dob);
                        if (dbUser.tob) localStorage.setItem('astranavi_user_tob', dbUser.tob);
                        if (dbUser.pob) localStorage.setItem('astranavi_user_pob', dbUser.pob);
                    }
                })
                .catch(err => console.error('Profile sync error:', err));
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
        if (profile?.moonSign) localStorage.setItem('astranavi_user_moon_sign', profile.moonSign);
        if (profile?.sunSign) localStorage.setItem('astranavi_user_sun_sign', profile.sunSign);
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
        localStorage.removeItem('astranavi_user_moon_sign');
        localStorage.removeItem('astranavi_user_sun_sign');
    };

    const showLoading = (message?: string, duration: number = 2000) => {
        setLoadingMessage(message);
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
        }, duration);
    };

    const setLoadingState = (state: boolean) => setIsLoading(state);

    const refreshUser = (updates: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        
        if (updates.name) localStorage.setItem('astranavi_user_name', updates.name);
        if (updates.dob) localStorage.setItem('astranavi_user_dob', updates.dob);
        if (updates.tob) localStorage.setItem('astranavi_user_tob', updates.tob);
        if (updates.pob) localStorage.setItem('astranavi_user_pob', updates.pob);
        if (updates.phoneNumber) localStorage.setItem('astranavi_user_phone', updates.phoneNumber);
        if (updates.moonSign) localStorage.setItem('astranavi_user_moon_sign', updates.moonSign);
        if (updates.sunSign) localStorage.setItem('astranavi_user_sun_sign', updates.sunSign);
    };

    if (!isMounted) return null;

    return (
        <AuthContext.Provider value={{ isLoggedIn, isLoading, user, login, logout, showLoading, setLoadingState, refreshUser }}>
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
