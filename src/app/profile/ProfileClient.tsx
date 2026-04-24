'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks';
import { 
    User, Calendar, Clock, MapPin, 
    Save, ArrowLeft, RotateCcw
} from 'lucide-react';

export default function ProfileSettingsPage() {
    const { user, login, showLoading, isLoading, isLoggedIn } = useAuth();
    const router = useRouter();
    const { showToast, ToastContainer, success, error } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        tob: '',
        pob: ''
    });
    const [errors, setErrors] = useState({
        name: '',
        dob: '',
        tob: '',
        pob: ''
    });
    const [touched, setTouched] = useState({
        name: false,
        dob: false,
        tob: false,
        pob: false
    });
    const [hasChanges, setHasChanges] = useState(false);

    // Pre-fill form when user data is available
    useEffect(() => {
        if (user) {
            const initialData = {
                name: user.name || '',
                dob: user.dob || '',
                tob: user.tob || '',
                pob: user.pob || ''
            };
            setFormData(initialData);
        }
    }, [user]);

    // Track changes
    useEffect(() => {
        if (user) {
            const changed = 
                formData.name !== (user.name || '') ||
                formData.dob !== (user.dob || '') ||
                formData.tob !== (user.tob || '') ||
                formData.pob !== (user.pob || '');
            setHasChanges(changed);
        }
    }, [formData, user]);

    // Only redirect if NOT logged in
    useEffect(() => {
        if (!isLoading && !isLoggedIn) {
            router.push('/login');
        }
    }, [isLoggedIn, isLoading, router]);

    const validateField = (field: keyof typeof formData, value: string) => {
        let error = '';
        
        switch (field) {
            case 'name':
                if (value.trim().length < 2) {
                    error = 'Name must be at least 2 characters';
                } else if (value.trim().length > 50) {
                    error = 'Name is too long';
                } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                    error = 'Name can only contain letters';
                }
                break;
            case 'dob':
                if (value) {
                    const dob = new Date(value);
                    const today = new Date();
                    const hundredYearsAgo = new Date();
                    hundredYearsAgo.setFullYear(today.getFullYear() - 120);

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
            tob: '',
            pob: validateField('pob', formData.pob)
        };

        setErrors(newErrors);
        setTouched({ name: true, dob: true, tob: true, pob: true });
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

        showLoading("Syncing your celestial coordinates...", 2000);
        
        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData), // Session handles email now
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "The stars are obscured. Please try again.");
            }

            // Update local context
            login(user?.email || '', formData);
            success('Celestial profile successfully updated!');
            setHasChanges(false);
            
            setTimeout(() => {
                showLoading("", 0);
            }, 500);

        } catch (err: any) {
            error(err.message);
            showLoading("", 0);
        }
    };

    const handleReset = () => {
        if (user) {
            setFormData({
                name: user.name || '',
                dob: user.dob || '',
                tob: user.tob || '',
                pob: user.pob || ''
            });
            setErrors({ name: '', dob: '', tob: '', pob: '' });
            setTouched({ name: false, dob: false, tob: false, pob: false });
            setHasChanges(false);
        }
    };

    return (
        <main className="min-h-[calc(100dvh-var(--navbar-height,64px))] pb-12 px-4 flex flex-col items-center justify-center relative overflow-x-hidden bg-[var(--bg)]">
            {ToastContainer}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-secondary/5 blur-[60px] sm:blur-[100px] rounded-full z-0 pointer-events-none"></div>
            
            <div className="w-full max-w-xl relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-surface-variant/50 border border-secondary/20 mb-4 sm:mb-6 cosmic-glow">
                        <User className="text-secondary w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-3">Celestial Profile</h1>
                    <p className="text-sm font-body text-on-surface-variant max-w-md mx-auto">
                        Manage your birth coordinates to ensure your cosmic readings are always perfectly aligned.
                    </p>
                </div>

                <Card padding="md" className="!rounded-[32px] sm:!rounded-[40px] border-outline-variant/20" hoverable={false}>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 gap-6">
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
                                {isLoading ? 'Updating...' : 'Save Changes'}
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
            </div>
        </main>
    );
}
