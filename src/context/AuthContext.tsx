'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { clientFetch, resetAuthGrace } from '@/lib/apiClient';
import { useTranslation } from '@/hooks';
import { LanguageCode, locales } from '@/locales';
import { isProfileComplete, normalizeProfileUser, resolveProfileComplete } from '@/lib/profileCompleteness';

export interface User {
    id?: string;
    email?: string | null;
    name?: string | null;
    dob?: string | null;
    tob?: string | null;
    pob?: string | null;
    birthPlaceName?: string | null;
    birthLatitude?: number | null;
    birthLongitude?: number | null;
    birthTimezoneName?: string | null;
    birthTimezoneOffsetAtBirth?: number | null;
    phoneNumber?: string | null;
    gender?: string | null;
    maritalStatus?: string | null;
    occupation?: string | null;
    moonSign?: string | null;
    sunSign?: string | null;
    lagnaSign?: string | null;
    astrologyData?: Record<string, unknown> | null;
    chartContext?: string | null;
    tier?: string | null;
    image?: string | null;
    language?: string | null;
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

const SESSION_RECOVERY_URL = '/login?error=SessionExpired&sessionCleared=1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: session, status } = useSession();
    const pathname = usePathname();
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

    const hasSessionError =
        session?.user?.error === "TokenReuseError" ||
        session?.user?.error === "RefreshAccessTokenError";
    const isLoggedIn = status === 'authenticated' && !hasSessionError;
    const isSessionLoading = status === 'loading';
    const sessionUserFallback: User | null =
        isLoggedIn && session?.user?.id
            ? {
                id: session.user.id,
                email: session.user.email ?? null,
                phoneNumber: session.user.phoneNumber ?? null,
                name: (session.user as any).name || undefined,
                image: (session.user as any).image ?? null,
            }
            : null;
    const effectiveUser = user ?? sessionUserFallback;

    useEffect(() => {
        if (session?.user) {
            const sessionUser = session.user as any;
            
// Handle NextAuth refresh errors.
            // TokenReuseError and RefreshAccessTokenError are now persisted in the
            // JWT cookie by the JWT callback so the middleware (auth.config.ts) can
            // detect them and redirect to /login before the page loads.
            if (sessionUser.error === "TokenReuseError") {
                setUser(null);
                setProfileComplete(false);
                setProfileFetched(false);
                fetchInProgressRef.current = false;
                // If we're already on the login page, the login page's own handler
                // will clear the session. Don't compete with it.
                if (pathname === '/login') return;
                console.error("[AuthContext] Token reuse detected in session. Signing out immediately.");
                if (!signOutInitiatedRef.current) {
                  signOutInitiatedRef.current = true;
                  fetch('/api/auth/clear-session', { method: 'POST' })
                    .catch(err => console.warn('[AuthContext] Session clear failed:', err))
                    .finally(() => {
                      signOut({ redirectTo: SESSION_RECOVERY_URL });
                    });
                }
                return;
            } else if (sessionUser.error === "RefreshAccessTokenError") {
                console.warn("[AuthContext] Refresh token error (possibly transient). Not signing out — will retry on next session poll.");
                setUser(null);
                setProfileComplete(false);
                setProfileFetched(false);
                fetchInProgressRef.current = false;
                // If already on login page, let the login page handle recovery
                if (pathname === '/login') return;
                return;
            }

            // Initial set from session using user ID as stable identifier
            if (sessionUser.id) {
                // If it's a different user, reset profile state
                if (prevEmailRef.current && prevEmailRef.current !== sessionUser.id) {
                    setProfileFetched(false);
                    fetchInProgressRef.current = false;
                    setUser({
                        id: sessionUser.id,
                        email: sessionUser.email ?? null,
                        phoneNumber: sessionUser.phoneNumber ?? null,
                        name: sessionUser.name || undefined,
                    });
                } else if (!user) {
                    setUser({
                        id: sessionUser.id,
                        email: sessionUser.email ?? null,
                        phoneNumber: sessionUser.phoneNumber ?? null,
                        name: sessionUser.name || undefined,
                    });
                }
                
                prevEmailRef.current = sessionUser.id;

                // Sync full profile from DB if we haven't fetched it yet this session
                if (!profileFetched && !fetchInProgressRef.current) {
                    fetchInProgressRef.current = true;
                    clientFetch(`/api/user/profile`)
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
        setUser(prev => {
            if (!prev) {
                const nextUser = { email, ...profile } as User;
                if (isProfileComplete(nextUser)) setProfileComplete(true);
                return nextUser;
            }
            const isSame = prev.email === email && prev.id === profile?.id && 
                Object.keys(profile || {}).every(k => prev[k as keyof User] === (profile as Record<string, unknown>)[k]);
            const nextUser = isSame ? prev : { ...prev, email, ...profile };
            if (isProfileComplete(nextUser)) setProfileComplete(true);
            return nextUser;
        });
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
        try {
            const res = await clientFetch(`/api/user/profile`);
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
    }, []);

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
            user: effectiveUser, 
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
