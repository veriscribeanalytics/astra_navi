'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast, useTranslation } from '@/hooks';
import { clientFetch } from '@/lib/apiClient';
import { 
    User, Calendar, Clock, MapPin, 
    Save, ArrowLeft, RotateCcw, Sparkles,
    Globe, Bell, Phone, Briefcase, Heart, Mail
} from 'lucide-react';

export default function ProfileSettingsPage() {
    const { user, login, showLoading, isLoading, isLoggedIn, refreshUser } = useAuth();
    const { t, language: contextLanguage, setLanguage, availableLanguages } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isOnboarding = searchParams?.get('onboarding') === 'true';
    const { ToastContainer, success, error } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        tob: '',
        pob: '',
        phoneNumber: '',
        gender: '',
        maritalStatus: '',
        occupation: '',
        language: '',
        preferences: { horoscope: true, notifications: false }
    });
    const [errors, setErrors] = useState({
        name: '',
        dob: '',
        tob: '',
        pob: '',
        phoneNumber: ''
    });
    const [touched, setTouched] = useState({
        name: false,
        dob: false,
        tob: false,
        pob: false,
        phoneNumber: false
    });
    const [hasChanges, setHasChanges] = useState(false);

    // Pre-fill form when user data is available
    useEffect(() => {
        if (user) {
            const initialData = {
                name: user.name || '',
                dob: user.dob || '',
                tob: user.tob || '',
                pob: user.pob || '',
                phoneNumber: user.phoneNumber || '',
                gender: user.gender || '',
                maritalStatus: user.maritalStatus || '',
                occupation: user.occupation || '',
                language: user.language || contextLanguage || 'en',
                preferences: {
                    horoscope: user.preferences?.horoscope ?? true,
                    notifications: user.preferences?.notifications ?? false
                }
            };
            setFormData(initialData);
        }
    }, [user, contextLanguage]);

    // Track changes
    useEffect(() => {
        if (user) {
            const changed = 
                formData.name !== (user.name || '') ||
                formData.dob !== (user.dob || '') ||
                formData.tob !== (user.tob || '') ||
                formData.pob !== (user.pob || '') ||
                formData.phoneNumber !== (user.phoneNumber || '') ||
                formData.gender !== (user.gender || '') ||
                formData.maritalStatus !== (user.maritalStatus || '') ||
                formData.occupation !== (user.occupation || '') ||
                formData.language !== (user.language || contextLanguage || 'en') ||
                formData.preferences.horoscope !== (user.preferences?.horoscope ?? true) ||
                formData.preferences.notifications !== (user.preferences?.notifications ?? false);
            setHasChanges(changed);
        }
    }, [formData, user, contextLanguage]);

    // Only redirect if NOT logged in
    useEffect(() => {
        if (!isLoading && !isLoggedIn) {
            const currentUrl = window.location.pathname + window.location.search;
            router.push(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
        }
    }, [isLoggedIn, isLoading, router]);

    const validateField = (field: keyof typeof formData, value: string) => {
        let error = '';
        
        switch (field) {
            case 'name':
                if (value.trim().length < 2) {
                    error = 'Name must be at least 2 characters';
                } else if (value.trim().length > 100) {
                    error = 'Name is too long';
                }
                break;
            case 'dob':
                if (value) {
                    const dob = new Date(value);
                    const today = new Date();
                    const hundredYearsAgo = new Date();
                    hundredYearsAgo.setFullYear(today.getFullYear() - 150);

                    if (dob > today) {
                        error = 'Birth date cannot be in the future';
                    } else if (dob < hundredYearsAgo) {
                        error = 'Please enter a valid birth date';
                    }
                }
                break;
            case 'pob':
                if (value.trim().length < 2) {
                    error = 'Please enter a valid place';
                } else if (value.trim().length > 100) {
                    error = 'Place name is too long';
                }
                break;
        }
        
        return error;
    };

    const validateForm = () => {
        const newErrors = {
            name: validateField('name', formData.name),
            dob: validateField('dob', formData.dob),
            tob: formData.tob ? '' : 'Time of birth is required',
            pob: validateField('pob', formData.pob),
            phoneNumber: ''
        };

        // In onboarding mode, name/dob/tob/pob are all required
        if (isOnboarding) {
            if (!formData.name.trim()) newErrors.name = 'Name is required';
            if (!formData.dob) newErrors.dob = 'Date of birth is required';
            if (!formData.tob) newErrors.tob = 'Time of birth is required';
            if (!formData.pob.trim()) newErrors.pob = 'Place of birth is required';
        }

        setErrors(newErrors);
        setTouched({ name: true, dob: true, tob: true, pob: true, phoneNumber: true });
        return !Object.values(newErrors).some(error => error !== '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            error('Please fix the errors before saving');
            return;
        }

        if (!user?.email) {
            error('No email found in session. Please logout and login again.');
            return;
        }

        showLoading("Updating your profile...", 2000);
        
        try {
            const response = await clientFetch('/api/user/profile', {
                method: 'PUT',
                body: JSON.stringify(formData), 
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Update failed. Please try again.");
            }

            // Update local context
            login(user?.email || '', formData);
            if (formData.language !== contextLanguage) {
                setLanguage(formData.language as any);
            }
            success('Profile updated successfully!');
            setHasChanges(false);
            
            // Trigger sign calculation if birth details are complete.
            // NOTE: The backend `sync-astrology` endpoint does NOT extract/save signs.
            // Signs (moonSign, sunSign, lagnaSign) are only persisted by `analyze-full`.
            // After analyze-full completes, the backend auto-saves signs to the DB.
            // We then re-fetch the profile to get the updated sign data.
            const hasBirthDetails = formData.dob && formData.tob && formData.pob;
            if (hasBirthDetails && data.requiresReanalysis) {
                clientFetch('/api/analyze-full', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ force_refresh: true })
                }).then(async (res) => {
                    if (res.ok) {
                        // Re-fetch profile to get the newly-calculated signs
                        const profileRes = await clientFetch(`/api/user/profile?email=${encodeURIComponent(user!.email!)}`);
                        if (profileRes.ok) {
                            const profileData = await profileRes.json();
                            if (profileData.user) {
                                refreshUser({
                                    moonSign: profileData.user.moonSign,
                                    sunSign: profileData.user.sunSign,
                                    lagnaSign: profileData.user.lagnaSign,
                                    astrologyData: profileData.user.astrologyData,
                                });
                            }
                        }
                    } else {
                        const errData = await res.json().catch(() => ({}));
                        console.warn('Sign calculation (analyze-full) failed:', errData.error || errData.detail || 'Unknown error');
                    }
                }).catch(err => {
                    console.warn('Sign calculation (analyze-full) failed:', err);
                });
            }

            setTimeout(() => {
                showLoading("", 0);
                if (isOnboarding) {
                    const returnUrl = searchParams?.get('return') || '/';
                    router.push(returnUrl);
                }
            }, 500);

        } catch (err: unknown) {
            error(err instanceof Error ? err.message : String(err));
            showLoading("", 0);
        }
    };

    const handleReset = () => {
        if (user) {
            setFormData({
                name: user.name || '',
                dob: user.dob || '',
                tob: user.tob || '',
                pob: user.pob || '',
                phoneNumber: user.phoneNumber || '',
                gender: user.gender || '',
                maritalStatus: user.maritalStatus || '',
                occupation: user.occupation || '',
                language: user.language || contextLanguage || 'en',
                preferences: {
                    horoscope: user.preferences?.horoscope ?? true,
                    notifications: user.preferences?.notifications ?? false
                }
            });
            setErrors({ name: '', dob: '', tob: '', pob: '', phoneNumber: '' });
            setTouched({ name: false, dob: false, tob: false, pob: false, phoneNumber: false });
            setHasChanges(false);
        }
    };

    return (
        <main className="min-h-[calc(100dvh-var(--navbar-height,64px))] pb-12 px-4 flex flex-col items-center justify-center relative overflow-x-hidden bg-[var(--bg)]">
            {ToastContainer}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-secondary/5 blur-[60px] sm:blur-[100px] rounded-full z-0 pointer-events-none"></div>
            
            <div className="w-full max-w-xl relative z-10">
                {isOnboarding && (
                    <div className="text-center mb-6 p-4 bg-secondary/10 border border-secondary/20 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500">
                        <p className="text-sm font-medium text-secondary flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4" /> Let&apos;s set up your profile to unlock personalized readings!
                        </p>
                    </div>
                )}

                <div className="text-center mb-10 mt-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-surface-variant/50 border border-secondary/20 mb-4 sm:mb-6 cosmic-glow">
                        <User className="text-secondary w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-3">User Profile</h1>
                    <p className="text-sm font-body text-on-surface-variant max-w-md mx-auto">
                        Manage your birth details to ensure your personalized readings are always accurate.
                    </p>
                </div>

                <Card padding="md" className="!rounded-[32px] sm:!rounded-[40px] border-outline-variant/20" hoverable={false}>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 gap-6">
                            <Input 
                                label="Email Address"
                                type="email"
                                icon={<Mail className="w-4 h-4" />}
                                value={user?.email || ''}
                                readOnly
                                disabled
                                helperText="Your email cannot be changed"
                            />
                            <Input 
                                label="Full Name"
                                placeholder="Enter your full name" 
                                type="text"
                                icon={<User className="w-4 h-4" />}
                                value={formData.name}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData({...formData, name: value});
                                    if (touched.name) {
                                        setErrors({...errors, name: validateField('name', value)});
                                    }
                                }}
                                onBlur={() => {
                                    setTouched({...touched, name: true});
                                    setErrors({...errors, name: validateField('name', formData.name)});
                                }}
                                error={touched.name ? errors.name : ''}
                                helperText="Your full name as per birth certificate"
                                required
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Input 
                                label="Date of Birth"
                                type="date"
                                icon={<Calendar className="w-4 h-4" />}
                                value={formData.dob}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData({...formData, dob: value});
                                    if (touched.dob) {
                                        setErrors({...errors, dob: validateField('dob', value)});
                                    }
                                }}
                                onBlur={() => {
                                    setTouched({...touched, dob: true});
                                    setErrors({...errors, dob: validateField('dob', formData.dob)});
                                }}
                                error={touched.dob ? errors.dob : ''}
                                helperText="Your birth date"
                                required
                            />
                            <Input 
                                label="Time of Birth"
                                type="time"
                                icon={<Clock className="w-4 h-4" />}
                                value={formData.tob}
                                onChange={(e) => setFormData({...formData, tob: e.target.value})}
                                helperText="Exact time for precision"
                                required
                            />
                        </div>
                        
                        <Input 
                            label="Place of Birth"
                            placeholder="City, Country" 
                            type="text"
                            icon={<MapPin className="w-4 h-4" />}
                            value={formData.pob}
                            onChange={(e) => {
                                const value = e.target.value;
                                setFormData({...formData, pob: value});
                                if (touched.pob) {
                                    setErrors({...errors, pob: validateField('pob', value)});
                                }
                            }}
                            onBlur={() => {
                                setTouched({...touched, pob: true});
                                setErrors({...errors, pob: validateField('pob', formData.pob)});
                            }}
                            error={touched.pob ? errors.pob : ''}
                            helperText="City and country of birth"
                            required
                        />

                        <Input 
                            label="Phone Number"
                            placeholder="+1234567890" 
                            type="tel"
                            icon={<Phone className="w-4 h-4" />} 
                            value={formData.phoneNumber}
                            onChange={(e) => {
                                const value = e.target.value;
                                setFormData({...formData, phoneNumber: value});
                            }}
                            helperText="Optional phone number"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <label htmlFor="gender" className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-2 block px-1">
                                    Gender
                                </label>
                                <select 
                                    id="gender"
                                    className="w-full h-12 bg-surface-variant/30 border border-outline-variant/30 rounded-xl px-4 text-on-surface focus:outline-none focus:border-secondary/50 transition-all appearance-none cursor-pointer"
                                    value={formData.gender}
                                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                >
                                    <option value="" disabled className="bg-surface text-on-surface">Select Gender</option>
                                    <option value="male" className="bg-surface text-on-surface">Male</option>
                                    <option value="female" className="bg-surface text-on-surface">Female</option>
                                    <option value="other" className="bg-surface text-on-surface">Other</option>
                                    <option value="Not Specified" className="bg-surface text-on-surface">Not Specified</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label htmlFor="maritalStatus" className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-2 block px-1">
                                    Marital Status
                                </label>
                                <select 
                                    id="maritalStatus"
                                    className="w-full h-12 bg-surface-variant/30 border border-outline-variant/30 rounded-xl px-4 text-on-surface focus:outline-none focus:border-secondary/50 transition-all appearance-none cursor-pointer"
                                    value={formData.maritalStatus}
                                    onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})}
                                >
                                    <option value="" disabled className="bg-surface text-on-surface">Select Status</option>
                                    <option value="single" className="bg-surface text-on-surface">Single</option>
                                    <option value="married" className="bg-surface text-on-surface">Married</option>
                                    <option value="divorced" className="bg-surface text-on-surface">Divorced</option>
                                    <option value="unmarried" className="bg-surface text-on-surface">Unmarried</option>
                                    <option value="not married" className="bg-surface text-on-surface">Not Married</option>
                                    <option value="wed" className="bg-surface text-on-surface">Wed</option>
                                    <option value="separated" className="bg-surface text-on-surface">Separated</option>
                                    <option value="widowed" className="bg-surface text-on-surface">Widowed</option>
                                    <option value="widow" className="bg-surface text-on-surface">Widow</option>
                                    <option value="widower" className="bg-surface text-on-surface">Widower</option>
                                    <option value="engaged" className="bg-surface text-on-surface">Engaged</option>
                                    <option value="relationship" className="bg-surface text-on-surface">Relationship</option>
                                    <option value="in relationship" className="bg-surface text-on-surface">In Relationship</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label htmlFor="occupation" className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-2 block px-1">
                                    Occupation
                                </label>
                                <select 
                                    id="occupation"
                                    className="w-full h-12 bg-surface-variant/30 border border-outline-variant/30 rounded-xl px-4 text-on-surface focus:outline-none focus:border-secondary/50 transition-all appearance-none cursor-pointer"
                                    value={formData.occupation}
                                    onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                                >
                                    <option value="" disabled className="bg-surface text-on-surface">Select Occupation</option>
                                    <option value="student" className="bg-surface text-on-surface">Student</option>
                                    <option value="studying" className="bg-surface text-on-surface">Studying</option>
                                    <option value="business" className="bg-surface text-on-surface">Business</option>
                                    <option value="employed" className="bg-surface text-on-surface">Employed</option>
                                    <option value="homemaker" className="bg-surface text-on-surface">Homemaker</option>
                                    <option value="retired" className="bg-surface text-on-surface">Retired</option>
                                    <option value="jobseeker" className="bg-surface text-on-surface">Jobseeker</option>
                                    <option value="other" className="bg-surface text-on-surface">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Language & Preferences Section */}
                        <div className="space-y-8 pt-4 border-t border-outline-variant/10">
                            <div className="space-y-4">
                                <label className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant/70 block px-1 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-secondary" /> Preferred Language
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                    {availableLanguages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            type="button"
                                            onClick={() => {
                                                setFormData({...formData, language: lang.code});
                                            }}
                                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all gap-1 ${
                                                formData.language === lang.code 
                                                    ? 'bg-secondary/10 border-secondary text-secondary' 
                                                    : 'bg-surface-variant/20 border-outline-variant/10 text-primary/40 hover:bg-surface-variant/40'
                                            }`}
                                        >
                                            <span className="text-[12px] normal-case">{lang.nativeName}</span>
                                            <span className="opacity-50 text-[8px]">{lang.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant/70 block px-1 flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-secondary" /> Cosmic Preferences
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData, 
                                            preferences: { ...formData.preferences, horoscope: !formData.preferences.horoscope }
                                        })}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-surface-variant/20 border border-outline-variant/10 hover:bg-surface-variant/40 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl transition-colors ${formData.preferences.horoscope ? 'bg-secondary/20 text-secondary' : 'bg-on-surface-variant/10 text-on-surface-variant/40'}`}>
                                                <Sparkles size={18} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-primary">Daily Horoscope</p>
                                                <p className="text-[10px] text-on-surface-variant/60">Receive daily cosmic insights</p>
                                            </div>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.preferences.horoscope ? 'bg-secondary' : 'bg-on-surface-variant/20'}`}>
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${formData.preferences.horoscope ? 'left-6' : 'left-1'}`} />
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData, 
                                            preferences: { ...formData.preferences, notifications: !formData.preferences.notifications }
                                        })}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-surface-variant/20 border border-outline-variant/10 hover:bg-surface-variant/40 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl transition-colors ${formData.preferences.notifications ? 'bg-secondary/20 text-secondary' : 'bg-on-surface-variant/10 text-on-surface-variant/40'}`}>
                                                <Bell size={18} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-primary">Notifications</p>
                                                <p className="text-[10px] text-on-surface-variant/60">Alerts for planetary transits</p>
                                            </div>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.preferences.notifications ? 'bg-secondary' : 'bg-on-surface-variant/20'}`}>
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${formData.preferences.notifications ? 'left-6' : 'left-1'}`} />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 flex flex-col sm:flex-row gap-4">
                            <Button 
                                type="submit" 
                                fullWidth 
                                size="lg" 
                                className="shadow-xl shadow-secondary/20"
                                disabled={isLoading || !hasChanges}
                                loading={isLoading}
                                leftIcon={!isLoading ? <Save className="w-4 h-4" /> : undefined}
                            >
                                {isLoading ? 'Updating...' : (isOnboarding ? 'Save & Continue to Dashboard' : 'Save Changes')}
                            </Button>
                            {hasChanges && (
                                <Button 
                                    type="button"
                                    variant="ghost"
                                    fullWidth 
                                    size="lg"
                                    onClick={handleReset}
                                    disabled={isLoading}
                                    leftIcon={<RotateCcw className="w-4 h-4" />}
                                >
                                    Reset
                                </Button>
                            )}
                            {!hasChanges && (
                                <Button 
                                    type="button"
                                    variant="ghost"
                                    fullWidth 
                                    size="lg"
                                    onClick={() => router.push('/')}
                                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                                >
                                    Back to Home
                                </Button>
                            )}
                        </div>
                    </form>
                </Card>

                {!isOnboarding && (
                    <Card padding="md" className="!rounded-[32px] sm:!rounded-[40px] border-outline-variant/20 mt-8" hoverable={false}>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-headline font-bold text-primary mb-2">Security Settings</h3>
                                <p className="text-sm text-on-surface-variant">Manage your password and active sessions.</p>
                            </div>
                            
                            <div className="pt-4 border-t border-outline-variant/10 space-y-4">
                                <Button 
                                    type="button" 
                                    variant="ghost"
                                    fullWidth
                                    onClick={() => router.push('/profile/security')}
                                >
                                    Manage Security Settings
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </main>
    );
}
