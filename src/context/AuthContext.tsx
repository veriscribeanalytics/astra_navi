'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

interface User {
    id?: string;
    email: string;
    name?: string;
    dob?: string;
    tob?: string;
    pob?: string;
    phoneNumber?: string;
    gender?: string;
    maritalStatus?: string;
    occupation?: string;
    moonSign?: string;
    sunSign?: string;
    lagnaSign?: string;
    astrologyData?: Record<string, unknown>;
}

interface ExtendedSessionUser {
    id?: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
}

interface AuthContextType {
    isLoggedIn: boolean;
    isLoading: boolean;
    user: User | null;
    login: (email?: string, profile?: Partial<User>) => void; // Keep for interface compatibility, but we use signIn elsewhere
    logout: (callbackUrl?: string) => Promise<void>;
    showLoading: (message?: string, duration?: number) => void;
    setLoadingState: (state: boolean) => void;
    refreshUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: session, status } = useSession();
    const [user, setUser] = useState<User | null>(null);
    const [profileFetched, setProfileFetched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);
    const fetchInProgressRef = useRef(false);

    const isLoggedIn = status === 'authenticated';
    const isSessionLoading = status === 'loading';

    useEffect(() => {
        if (session?.user) {
            const sessionUser = session.user as ExtendedSessionUser;
            
            // Initial set from session
            if (sessionUser.email) {
                setUser(prev => {
                    if (prev && prev.email === sessionUser.email) return prev;
                    return {
                        id: sessionUser.id,
                        email: sessionUser.email!,
                        name: sessionUser.name || undefined,
                    };
                });

                // Reset profileFetched if it's a different user
                if (user && user.email !== sessionUser.email) {
                    setProfileFetched(false);
                    fetchInProgressRef.current = false;
                }
            }

            // Sync full profile from DB if we haven't fetched it yet this session
            if (sessionUser.email && !profileFetched && !fetchInProgressRef.current) {
                fetchInProgressRef.current = true;
                fetch(`/api/user/profile?email=${encodeURIComponent(sessionUser.email)}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.user) {
                            setUser(prev => {
                                // Deep comparison to avoid unnecessary state updates
                                if (!prev) return data.user;
                                
                                const isSame = 
                                    prev.email === data.user.email && 
                                    prev.moonSign === data.user.moonSign &&
                                    prev.sunSign === data.user.sunSign &&
                                    prev.lagnaSign === data.user.lagnaSign &&
                                    prev.name === data.user.name &&
                                    JSON.stringify(prev.astrologyData) === JSON.stringify(data.user.astrologyData);
                                
                                return isSame ? prev : { ...prev, ...data.user };
                            });
                        }
                        setProfileFetched(true);
                    })
                    .catch(err => {
                        console.error('Profile sync error:', err);
                        setProfileFetched(true); // Don't retry indefinitely on error
                    })
                    .finally(() => {
                        fetchInProgressRef.current = false;
                    });
            }
        } else if (status === 'unauthenticated') {
            setUser(prev => prev === null ? prev : null);
            setProfileFetched(prev => prev === false ? prev : false);
            fetchInProgressRef.current = false;
        }
    }, [session, status, profileFetched, user]);

    const login = useCallback((email?: string, profile?: Partial<User>) => {
        // This is now primarily handled by NextAuth signIn() in LoginPage
        // We keep it for local state synchronization if needed
        if (email) {
            setUser(prev => {
                const isSame = prev && prev.email === email && 
                               Object.keys(profile || {}).every(k => (prev as unknown as Record<string, unknown>)[k] === (profile as Record<string, unknown>)[k]);
                return isSame ? prev : (prev ? { ...prev, email, ...profile } : { email, ...profile } as User);
            });
        }
    }, []);

    const logout = useCallback(async (callbackUrl: string = '/?logout=success') => {
        await signOut({ callbackUrl });
    }, []);

    const showLoading = useCallback((message?: string, duration: number = 2000) => {
        setLoadingMessage(message);
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
        }, duration);
    }, []);

    const setLoadingState = useCallback((state: boolean) => setIsLoading(state), []);

    const refreshUser = useCallback((updates: Partial<User>) => {
        setUser(prev => {
            if (!prev) return null;
            const isSame = Object.keys(updates).every(k => (prev as unknown as Record<string, unknown>)[k] === (updates as Record<string, unknown>)[k]);
            return isSame ? prev : { ...prev, ...updates };
        });
    }, []);

    return (
        <AuthContext.Provider value={{ 
            isLoggedIn, 
            isLoading: isLoading || isSessionLoading || (isLoggedIn && !profileFetched), 
            user, 
            login, 
            logout, 
            showLoading, 
            setLoadingState, 
            refreshUser 
        }}>
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
