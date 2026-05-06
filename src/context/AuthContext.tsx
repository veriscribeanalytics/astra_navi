'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { clientFetch } from '@/lib/apiClient';

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

interface AuthContextType {
    isLoggedIn: boolean;
    isLoading: boolean;
    user: User | null;
    profileComplete: boolean;
    profileFetched: boolean;
    login: (email?: string, profile?: Partial<User>) => void;
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
    const prevEmailRef = useRef<string | null>(null);
    const profileRetryCount = useRef(0);
    const MAX_PROFILE_RETRIES = 2;

    const isLoggedIn = status === 'authenticated';
    const isSessionLoading = status === 'loading';
    const profileComplete = !!(user?.name && user?.dob && user?.tob && user?.pob);

    // Track how many consecutive times we've seen RefreshAccessTokenError
    // Only sign out after seeing it persist across multiple session updates
    const refreshErrorCount = useRef(0);
    const REFRESH_ERROR_THRESHOLD = 3;

    useEffect(() => {
        if (session?.user) {
            const sessionUser = session.user;
            
            // Handle NextAuth refresh errors — but don't sign out immediately.
            // A single refresh failure could be a transient network issue.
            // Only sign out if the error persists across multiple session checks.
            if (sessionUser.error === "RefreshAccessTokenError") {
                refreshErrorCount.current++;
                console.warn(`[AuthContext] RefreshAccessTokenError seen (${refreshErrorCount.current}/${REFRESH_ERROR_THRESHOLD})`);
                
                if (refreshErrorCount.current >= REFRESH_ERROR_THRESHOLD) {
                    console.error("[AuthContext] Refresh token is truly invalid. Signing out.");
                    signOut({ callbackUrl: '/login?error=SessionExpired' });
                    return;
                }
                // Don't sign out yet — let the next session check try again
            } else {
                // Reset counter when there's no error
                refreshErrorCount.current = 0;
            }
            
            // Initial set from session
            if (sessionUser.email) {
                // If it's a different user, reset profile state
                if (prevEmailRef.current && prevEmailRef.current !== sessionUser.email) {
                    setProfileFetched(false);
                    fetchInProgressRef.current = false;
                    setUser({
                        id: sessionUser.id,
                        email: sessionUser.email!,
                        name: sessionUser.name || undefined,
                    });
                } else if (!user) {
                    setUser({
                        id: sessionUser.id,
                        email: sessionUser.email!,
                        name: sessionUser.name || undefined,
                    });
                }
                
                prevEmailRef.current = sessionUser.email;

                // Sync full profile from DB if we haven't fetched it yet this session
                if (!profileFetched && !fetchInProgressRef.current) {
                    fetchInProgressRef.current = true;
                    clientFetch(`/api/user/profile?email=${encodeURIComponent(sessionUser.email)}`)
                        .then(res => {
                            if (!res.ok) {
                                console.warn(`[AuthContext] Profile fetch returned ${res.status}. Will use session data only.`);
                                setProfileFetched(true);
                                return null;
                            }
                            return res.json();
                        })
                        .then(data => {
                            if (data?.user) {
                                setUser(prev => {
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
                            } else {
                                console.warn('[AuthContext] Profile fetch returned no user object. Data keys:', Object.keys(data || {}));
                            }
                            setProfileFetched(true);
                            profileRetryCount.current = 0;
                        })
                        .catch(err => {
                            console.error('Profile sync error:', err);
                            profileRetryCount.current++;
                            if (profileRetryCount.current >= MAX_PROFILE_RETRIES) {
                                setProfileFetched(true); 
                            }
                        })
                        .finally(() => {
                            fetchInProgressRef.current = false;
                        });
                }
            }
        } else if (status === 'unauthenticated') {
            setUser(null);
            setProfileFetched(false);
            fetchInProgressRef.current = false;
            prevEmailRef.current = null;
            profileRetryCount.current = 0;
            refreshErrorCount.current = 0;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, status, profileFetched]); // Removed user from dependencies

    const login = useCallback((email?: string, profile?: Partial<User>) => {
        if (email) {
            setUser(prev => {
                if (!prev) return { email, ...profile } as User;
                const isSame = prev.email === email && 
                    Object.keys(profile || {}).every(k => prev[k as keyof User] === (profile as Record<string, unknown>)[k]);
                return isSame ? prev : { ...prev, email, ...profile };
            });
        }
    }, []);

    const logout = useCallback(async (callbackUrl: string = '/?logout=success') => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
            }).catch(err => console.warn('Backend logout call failed:', err));
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            await signOut({ callbackUrl });
        }
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
            const isSame = Object.keys(updates).every(k => prev[k as keyof User] === updates[k as keyof User]);
            return isSame ? prev : { ...prev, ...updates };
        });
    }, []);

    return (
        <AuthContext.Provider value={{ 
            isLoggedIn, 
            isLoading: isLoading || isSessionLoading, 
            user, 
            profileComplete,
            profileFetched,
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
