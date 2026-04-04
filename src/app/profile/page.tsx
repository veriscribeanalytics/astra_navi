'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function ProfileSettingsPage() {
    const { user, login, showLoading, isLoading, isLoggedIn } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        tob: '',
        pob: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Pre-fill form when user data is available
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                dob: user.dob || '',
                tob: user.tob || '',
                pob: user.pob || ''
            });
        }
    }, [user]);

    // Only redirect if NOT logged in
    useEffect(() => {
        if (!isLoading && !isLoggedIn) {
            router.push('/login');
        }
    }, [isLoggedIn, isLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!user?.email) {
            setError("No email found in session. Please logout and login again.");
            return;
        }

        showLoading("Syncing your celestial coordinates...", 2000);
        
        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: user.email,
                    ...formData 
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "The stars are obscured. Please try again.");
            }

            // Update local context
            login(user?.email || '', formData);
            setSuccess("Celestial profile successfully updated!");
            
            setTimeout(() => {
                showLoading("", 0);
            }, 500);

        } catch (err: any) {
            setError(err.message);
            showLoading("", 0);
        }
    };

    return (
        <main className="min-h-screen pt-24 pb-12 px-4 flex flex-col items-center justify-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 blur-[100px] rounded-full z-0 pointer-events-none"></div>
            
            <div className="w-full max-w-xl relative z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-headline font-bold text-primary mb-3">Celestial Profile</h1>
                    <p className="text-sm font-body text-on-surface-variant max-w-md mx-auto">
                        Manage your birth coordinates to ensure your cosmic readings are always perfectly aligned.
                    </p>
                    
                    {error && (
                        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider">
                             &times; {error}
                        </div>
                    )}

                    {success && (
                        <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-2">
                             ✓ {success}
                        </div>
                    )}
                </div>

                <Card padding="lg" className="cosmic-glow border-secondary/20" hoverable={false}>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 gap-6">
                            <Input 
                                label="Full Name"
                                placeholder="Enter your full name" 
                                type="text"
                                icon="person"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Input 
                                label="Date of Birth"
                                type="date"
                                icon="calendar_month"
                                value={formData.dob}
                                onChange={(e) => setFormData({...formData, dob: e.target.value})}
                                required
                            />
                            <Input 
                                label="Time of Birth"
                                type="time"
                                icon="schedule"
                                value={formData.tob}
                                onChange={(e) => setFormData({...formData, tob: e.target.value})}
                                required
                            />
                        </div>
                        
                        <Input 
                            label="Place of Birth"
                            placeholder="City, Country" 
                            type="text"
                            icon="location_on"
                            value={formData.pob}
                            onChange={(e) => setFormData({...formData, pob: e.target.value})}
                            required
                        />
                        
                        <div className="pt-4 flex flex-col sm:flex-row gap-4">
                            <Button 
                                type="submit" 
                                fullWidth 
                                size="lg" 
                                className="shadow-xl shadow-secondary/20"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="material-symbols-outlined animate-spin text-sm">autorenew</span>
                                        Updating...
                                    </span>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                            <Button 
                                type="button"
                                variant="ghost"
                                fullWidth 
                                size="lg"
                                onClick={() => router.push('/')}
                            >
                                Back to Stars
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </main>
    );
}
