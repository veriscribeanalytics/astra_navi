'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { ShieldCheck, Lock, LogOut, AlertTriangle, ArrowLeft, Eye } from 'lucide-react';
import { clientFetch } from '@/lib/apiClient';

export default function SecuritySettingsPage() {
    const { logout, isLoggedIn, isLoading } = useAuth();
    const router = useRouter();
    const { ToastContainer, success, error } = useToast();

    // Change Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Logout All Devices State
    const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

    // Delete Account State
    const [deletePassword, setDeletePassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (!isLoading && !isLoggedIn) {
            router.push('/login');
        }
    }, [isLoggedIn, isLoading, router]);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword.length < 10) {
            error("New password must be at least 10 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            error("New passwords do not match.");
            return;
        }

        setIsChangingPassword(true);

        try {
            const res = await clientFetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to change password");
            }

            success("Password changed successfully. You will be logged out of all devices.");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            
            setTimeout(() => {
                logout();
            }, 3000);
        } catch (err: unknown) {
            error(err instanceof Error ? err.message : String(err));
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleLogoutAll = async () => {
        if (!confirm("Are you sure you want to log out from all other devices?")) {
            return;
        }

        setIsLoggingOutAll(true);
        try {
            const res = await clientFetch('/api/auth/logout-all', {
                method: 'POST'
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to log out other devices");
            }

            success("Successfully logged out from all other devices.");
        } catch (err: unknown) {
            error(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoggingOutAll(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            error("Please enter your password to confirm deletion.");
            return;
        }

        setIsDeleting(true);
        try {
            const res = await clientFetch('/api/auth/account', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: deletePassword }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to delete account");
            }

            success("Account successfully deleted. Goodbye.");
            setShowDeleteModal(false);
            setTimeout(() => {
                logout();
            }, 2000);
        } catch (err: unknown) {
            error(err instanceof Error ? err.message : String(err));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <main className="min-h-[calc(100dvh-var(--navbar-height,64px))] pb-12 px-4 flex flex-col items-center justify-center relative overflow-x-hidden bg-[var(--bg)]">
            {ToastContainer}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-secondary/5 blur-[60px] sm:blur-[100px] rounded-full z-0 pointer-events-none"></div>
            
            <div className="w-full max-w-xl relative z-10">
                <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => router.push('/profile')} 
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                    className="mb-6 -ml-4"
                >
                    Back to Profile
                </Button>

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-surface-variant/50 border border-secondary/20 mb-4 sm:mb-6 cosmic-glow">
                        <ShieldCheck className="text-secondary w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-3">Security Settings</h1>
                    <p className="text-sm font-body text-on-surface-variant max-w-md mx-auto">
                        Manage your password, active sessions, and account data.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Change Password Card */}
                    <Card padding="md" className="!rounded-[32px] sm:!rounded-[40px] border-outline-variant/20" hoverable={false}>
                        <h2 className="text-xl font-headline font-bold text-primary mb-4 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-secondary" /> Change Password
                        </h2>
                        <div className="mb-6 p-4 rounded-xl bg-surface-variant/30 border border-outline-variant/20 text-xs text-on-surface-variant">
                            Changing your password will automatically log you out of all active sessions, including this one.
                        </div>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="relative">
                                <Input 
                                    type={showPassword ? "text" : "password"} 
                                    label="Current Password"
                                    placeholder="Enter current password" 
                                    value={currentPassword} 
                                    onChange={(e) => setCurrentPassword(e.target.value)} 
                                    required 
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[38px] text-on-surface-variant/30 hover:text-secondary"><Eye size={16} /></button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input 
                                    type={showPassword ? "text" : "password"} 
                                    label="New Password"
                                    placeholder="Enter new password" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                    required 
                                />
                                <Input 
                                    type={showPassword ? "text" : "password"} 
                                    label="Confirm New Password"
                                    placeholder="Confirm new password" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    required 
                                />
                            </div>
                            <Button type="submit" loading={isChangingPassword} className="mt-2 gold-gradient">
                                Update Password
                            </Button>
                        </form>
                    </Card>

                    {/* Session Management Card */}
                    <Card padding="md" className="!rounded-[32px] sm:!rounded-[40px] border-outline-variant/20" hoverable={false}>
                        <h2 className="text-xl font-headline font-bold text-primary mb-2 flex items-center gap-2">
                            <LogOut className="w-5 h-5 text-secondary" /> Session Management
                        </h2>
                        <p className="text-sm text-on-surface-variant mb-6">
                            Log out from all other devices where your account is currently signed in. This device will remain logged in.
                        </p>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={handleLogoutAll} 
                            loading={isLoggingOutAll}
                            className="border-secondary/30 hover:bg-secondary/10"
                        >
                            Log Out All Other Devices
                        </Button>
                    </Card>

                    {/* Danger Zone */}
                    <Card padding="md" className="!rounded-[32px] sm:!rounded-[40px] border-error/20 bg-error/5" hoverable={false}>
                        <h2 className="text-xl font-headline font-bold text-error mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Danger Zone
                        </h2>
                        <p className="text-sm text-on-surface-variant mb-6">
                            Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <Button 
                            type="button" 
                            className="bg-error hover:bg-error/80 text-white" 
                            onClick={() => setShowDeleteModal(true)}
                        >
                            Delete Account
                        </Button>
                    </Card>
                </div>
            </div>

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-surface border border-error/20 rounded-3xl p-6 shadow-2xl">
                        <div className="flex items-center gap-3 text-error mb-4">
                            <AlertTriangle className="w-6 h-6" />
                            <h3 className="text-xl font-bold">Delete Account</h3>
                        </div>
                        <p className="text-sm text-on-surface-variant mb-6">
                            This action is permanent and will securely erase all your birth details, generated horoscopes, and preferences. Please confirm with your password to proceed.
                        </p>
                        <div className="space-y-4">
                            <Input 
                                type="password" 
                                placeholder="Enter your password to confirm" 
                                value={deletePassword} 
                                onChange={(e) => setDeletePassword(e.target.value)} 
                            />
                            <div className="flex gap-3 pt-2">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    fullWidth 
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeletePassword('');
                                    }}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="button" 
                                    fullWidth 
                                    className="bg-error hover:bg-error/80 text-white" 
                                    loading={isDeleting}
                                    onClick={handleDeleteAccount}
                                    disabled={!deletePassword}
                                >
                                    Delete Forever
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
