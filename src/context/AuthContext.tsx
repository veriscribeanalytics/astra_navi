'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { clientFetch, resetAuthGrace } from '@/lib/apiClient';
import { useTranslation } from '@/hooks';
import { LanguageCode, locales } from '@/locales';
import { isProfileComplete, normalizeProfileUser, resolveProfileComplete } from '@/lib/profileCompleteness';

interface User {
    id?: string;
    email: string;
    name?: string;
    dob?: string;
    tob?: string;
    pob?: string;
    birthPlaceName?: string;
    birthLatitude?: number;
    birthLongitude?: number;
    birthTimezoneName?: string;
    birthTimezoneOffsetAtBirth?: number;
    phoneNumber?: string;
    gender?: string;
    maritalStatus?: string;
    occupation?: string;
    moonSign?: string;
    sunSign?: string;
    lagnaSign?: string;
    astrologyData?: Record<string, unknown>;
    chartContext?: string;
    tier?: string;
    image?: string | null;
    language?: string;
    preferences?: {
        horoscope?: boolean;
        notifications?: boolean;
        [key: string]: unknown;
    };
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
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: session, status } = useSession();
    const [user, setUser] = useState<User | null>(null);
    const [profileComplete, setProfileComplete] = useState(false);
    const [profileFetched, setProfileFetched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);
    const signOutInitiatedRef = useRef(false);
    const fetchInProgressRef = useRef(false);
    const prevEmailRef = useRef<string | null>(null);
    const profileRetryCount = useRef(0);
    const MAX_PROFILE_RETRIES = 2;

    // Language sync: useTranslation gives us syncLanguageFromProfile (no backend PUT)
    // and the current frontend language.  We store them in refs to avoid adding
    // them as deps to the main session/profile useEffect (which would cause
    // unnecessary re-fetches).
    const { syncLanguageFromProfile, language: contextLanguage } = useTranslation();
    const syncLangRef = useRef(syncLanguageFromProfile);
    syncLangRef.current = syncLanguageFromProfile;
    const contextLanguageRef = useRef(contextLanguage);
    contextLanguageRef.current = contextLanguage;

    const isLoggedIn = status === 'authenticated';
    const isSessionLoading = status === 'loading';

    useEffect(() => {
        if (session?.user) {
            const sessionUser = session.user;
            
// Handle NextAuth refresh errors.
            // TokenReuseError and RefreshAccessTokenError are now persisted in the
            // JWT cookie by the JWT callback so the middleware (auth.config.ts) can
            // detect them and redirect to /login before the page loads.
            if (sessionUser.error === "TokenReuseError") {
                console.error("[AuthContext] Token reuse detected in session. Signing out immediately.");
                // TokenReuseError is unrecoverable — the refresh token has been
                // revoked by the backend.  Sign out & clear the poisoned cookie
                // immediately; don't wait (the old 3s delay allowed in-flight
                // requests but the middleware already redirects to /login now).
                if (!signOutInitiatedRef.current) {
                  signOutInitiatedRef.current = true;
                  signOut({ callbackUrl: '/login?error=SessionExpired' });
                }
                return;
            } else if (sessionUser.error === "RefreshAccessTokenError") {
                // Transient error — network issue, etc. The middleware will redirect
                // to /login, but if the user manages to stay on a page, don't sign
                // them out aggressively.  The next session poll will retry the
                // refresh.  If truly expired, clientFetch handles 401s.
                console.warn("[AuthContext] Refresh token error (possibly transient). Not signing out — will retry on next session poll.");
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
                                const normalizedUser = normalizeProfileUser(data.user);
                                setUser(prev => {
                                    if (!prev) return normalizedUser;
                                    const merged = { ...prev, ...normalizedUser };
                                    return JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged;
                                });

                                // Sync frontend language from backend profile.
                                // If the profile has a different language than the current
                                // frontend language, update the UI to match the source of
                                // truth (backend profile).  Uses syncLanguageFromProfile
                                // which does NOT PUT back to the backend — avoids loops.
                                const profileLanguage = normalizedUser.language;
                                if (profileLanguage &&
                                    locales[profileLanguage as LanguageCode] &&
                                    profileLanguage !== contextLanguageRef.current) {
                                    syncLangRef.current(profileLanguage as LanguageCode);
                                }

                                // Use backend's profileComplete flag if provided,
                                // otherwise fall back to checking required fields
                                setProfileComplete(resolveProfileComplete(data.profileComplete, normalizedUser));
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
            setProfileComplete(false);
            setProfileFetched(false);
            fetchInProgressRef.current = false;
            signOutInitiatedRef.current = false;
            prevEmailRef.current = null;
            profileRetryCount.current = 0;
            resetAuthGrace();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, status, profileFetched]); // Removed user from dependencies

    const login = useCallback((email?: string, profile?: Partial<User>) => {
        if (email) {
            setUser(prev => {
                if (!prev) {
                    const nextUser = { email, ...profile } as User;
                    if (isProfileComplete(nextUser)) setProfileComplete(true);
                    return nextUser;
                }
                const isSame = prev.email === email && 
                    Object.keys(profile || {}).every(k => prev[k as keyof User] === (profile as Record<string, unknown>)[k]);
                const nextUser = isSame ? prev : { ...prev, email, ...profile };
                if (isProfileComplete(nextUser)) setProfileComplete(true);
                return nextUser;
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

    const refreshProfile = useCallback(async () => {
        if (!user?.email) return;
        try {
            const res = await clientFetch(`/api/user/profile?email=${encodeURIComponent(user.email)}`);
            if (!res.ok) return;
            const data = await res.json();
            if (data?.user) {
                const normalizedUser = normalizeProfileUser(data.user);
                setUser(prev => prev ? { ...prev, ...normalizedUser } : normalizedUser);
                setProfileComplete(resolveProfileComplete(data.profileComplete, normalizedUser));
            }
        } catch (err) {
            console.error('[AuthContext] refreshProfile failed:', err);
        }
    }, [user?.email]);

    // Listen for language changes from LanguageContext.setLanguage().
    // When a user manually changes their language via the language picker,
    // LanguageContext dispatches a 'user-language-changed' custom event.
    // We update user.language here so AuthContext stays in sync without
    // needing a round-trip to the backend.
    useEffect(() => {
        const handler = (e: Event) => {
            const { code } = (e as CustomEvent<{ code: string }>).detail;
            if (code && typeof code === 'string' && locales[code as LanguageCode]) {
                refreshUser({ language: code });
            }
        };
        window.addEventListener('user-language-changed', handler);
        return () => window.removeEventListener('user-language-changed', handler);
    }, [refreshUser]);

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
            refreshUser,
            refreshProfile 
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
