'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast, useTranslation } from '@/hooks';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ShieldCheck, Lock, LogOut, AlertTriangle, ArrowLeft, Eye, Clock, MailX, RotateCcw } from 'lucide-react';
import { clientFetch } from '@/lib/apiClient';
import { parseAuthError } from '@/utils/authErrorParser';

export default function SecuritySettingsPage() {
    const { logout, isLoggedIn, isLoading } = useAuth();
    const { t } = useTranslation();
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
    const [showLogoutAllDialog, setShowLogoutAllDialog] = useState(false);

    // Delete Account State
    const [deletePassword, setDeletePassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Pending-deletion confirmation state. After the backend accepts a
    // delete-request, the account stays fully active for a 48h cooling-off
    // window, then is restorable for 30 more days. We show this banner (with a
    // one-tap Mode B cancel) instead of the old "instant delete + logout".
    const [pendingDeletion, setPendingDeletion] = useState<{ executeAfter: string | null; emailSent: boolean } | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !isLoggedIn) {
            router.push('/login');
        }
    }, [isLoggedIn, isLoading, router]);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 10) {
            error(t('profile.security.errors.passwordMinLength'));
            return;
        }

        if (newPassword !== confirmPassword) {
            error(t('profile.security.errors.passwordMismatch'));
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

            success(t('profile.security.messages.passwordChanged'));
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
        setIsLoggingOutAll(true);
        try {
            const res = await clientFetch('/api/auth/logout-all', {
                method: 'POST'
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to log out other devices");
            }

            success(t('profile.security.messages.logoutAllSuccess'));
        } catch (err: unknown) {
            error(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoggingOutAll(false);
            setShowLogoutAllDialog(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            error(t('profile.security.errors.passwordRequired'));
            return;
        }

        setDeleteError(null);
        setIsDeleting(true);
        try {
            const res = await clientFetch('/api/auth/account/delete-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: deletePassword }),
            });

            const data = await res.json();
            if (!res.ok) {
                // Preserve the backend's structured code so common cases (wrong
                // password, repeat request, locked) get a meaningful message
                // instead of a generic "something went wrong".
                const parsed = parseAuthError(data);
                const msg = parsed.message || data.error || data.detail
                    || t('profile.security.errors.deleteFailed');
                throw new Error(msg);
            }

            // Deletion is no longer instant — the backend created a 48h
            // cooling-off request. Keep the user logged in and show the
            // pending-deletion banner with the timing + a one-tap cancel.
            setPendingDeletion({
                executeAfter: typeof data.executeAfter === 'string' ? data.executeAfter : null,
                emailSent: data.emailSent === true,
            });
            setShowDeleteModal(false);
            setDeletePassword('');
            success(t('profile.security.messages.deletionRequested'));
        } catch (err: unknown) {
            setDeleteError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsDeleting(false);
        }
    };

    // Cancel a *pending* deletion while the account is still active (Mode B).
    // The caller is authenticated, so the BFF forwards the live JWT and no
    // password is needed. On success the cooling-off request is withdrawn.
    const handleCancelDeletion = async () => {
        setIsCancelling(true);
        setDeleteError(null);
        try {
            const res = await clientFetch('/api/auth/account/cancel-deletion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            const data = await res.json();
            if (!res.ok) {
                const parsed = parseAuthError(data);
                throw new Error(parsed.message || data.error || data.detail
                    || t('profile.security.errors.cancelFailed'));
            }

            setPendingDeletion(null);
            success(t('profile.security.messages.deletionCancelled'));
        } catch (err: unknown) {
            setDeleteError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <main className="min-h-[calc(100dvh-var(--navbar-height,64px))] pb-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative overflow-x-hidden bg-[var(--bg)]">
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
                    {t('profile.security.backButton')}
                </Button>

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-surface-variant/50 border border-secondary/20 mb-4 sm:mb-6 cosmic-glow">
                        <ShieldCheck className="text-secondary w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-3">{t('profile.security.pageTitle')}</h1>
                    <p className="text-sm font-body text-on-surface-variant max-w-md mx-auto">
                        {t('profile.security.pageDescription')}
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Change Password Card */}
                    <Card padding="md" className="!rounded-[32px] sm:!rounded-[40px] border-outline-variant/20" hoverable={false}>
                        <h2 className="text-xl font-headline font-bold text-primary mb-4 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-secondary" /> {t('profile.security.changePasswordTitle')}
                        </h2>
                        <div className="mb-6 p-4 rounded-xl bg-surface-variant/30 border border-outline-variant/20 text-xs text-on-surface-variant">
                            {t('profile.security.changePasswordWarning')}
                        </div>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    label={t('profile.security.currentPasswordLabel')}
                                    placeholder={t('profile.security.currentPasswordPlaceholder')}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[38px] text-on-surface-variant/30 hover:text-secondary"><Eye size={16} /></button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    label={t('profile.security.newPasswordLabel')}
                                    placeholder={t('profile.security.newPasswordPlaceholder')}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    label={t('profile.security.confirmPasswordLabel')}
                                    placeholder={t('profile.security.confirmPasswordPlaceholder')}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" loading={isChangingPassword} className="mt-2 gold-gradient">
                                {t('profile.security.updatePasswordButton')}
                            </Button>
                        </form>
                    </Card>

                    {/* Session Management Card */}
                    <Card padding="md" className="!rounded-[32px] sm:!rounded-[40px] border-outline-variant/20" hoverable={false}>
                        <h2 className="text-xl font-headline font-bold text-primary mb-2 flex items-center gap-2">
                            <LogOut className="w-5 h-5 text-secondary" /> {t('profile.security.sessionManagementTitle')}
                        </h2>
                        <p className="text-sm text-on-surface-variant mb-6">
                            {t('profile.security.sessionManagementDescription')}
                        </p>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowLogoutAllDialog(true)}
                            className="border-secondary/30 hover:bg-secondary/10"
                        >
                            {t('profile.security.logoutAllButton')}
                        </Button>
                    </Card>

                    {/* Danger Zone */}
                    <Card padding="md" className="!rounded-[32px] sm:!rounded-[40px] border-error/20 bg-error/5" hoverable={false}>
                        <h2 className="text-xl font-headline font-bold text-error mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> {t('profile.security.dangerZoneTitle')}
                        </h2>
                        <p className="text-sm text-on-surface-variant mb-4">
                            {t('profile.security.dangerZoneDescription')}
                        </p>
                        <ul className="text-xs text-on-surface-variant/80 space-y-1.5 mb-6 pl-1">
                            <li className="flex gap-2"><Clock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-on-surface-variant/50" />{t('profile.security.timing.firstWindow')}</li>
                            <li className="flex gap-2"><Clock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-on-surface-variant/50" />{t('profile.security.timing.restoreWindow')}</li>
                            <li className="flex gap-2"><Clock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-on-surface-variant/50" />{t('profile.security.timing.permanent')}</li>
                        </ul>

                        {pendingDeletion ? (
                            /* Pending-deletion banner: the request is filed but
                               the account is still active. Offer a one-tap Mode B
                               cancel — no password needed while still in the
                               cooling-off window. */
                            <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-4 sm:p-5 space-y-3">
                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
                                    <div className="flex-1 text-sm text-on-surface-variant space-y-1.5">
                                        <p className="font-semibold text-primary">
                                            {t('profile.security.pending.title')}
                                        </p>
                                        <p>{t('profile.security.pending.description')}</p>
                                        {!pendingDeletion.emailSent && (
                                            <p className="flex items-start gap-1.5 text-error/90">
                                                <MailX className="w-4 h-4 mt-0.5 shrink-0" />
                                                <span>{t('profile.security.pending.emailNotSent')}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        loading={isCancelling}
                                        onClick={handleCancelDeletion}
                                        className="border-secondary/40 hover:bg-secondary/10"
                                    >
                                        <RotateCcw className="w-4 h-4" /> {t('profile.security.pending.cancelButton')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                type="button"
                                className="bg-error hover:bg-error/80 text-white"
                                onClick={() => setShowDeleteModal(true)}
                            >
                                {t('profile.security.deleteAccountButton')}
                            </Button>
                        )}

                        {deleteError && (
                            <p className="mt-3 text-xs text-error flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                {deleteError}
                            </p>
                        )}
                    </Card>
                </div>
            </div>

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-surface border border-error/20 rounded-3xl p-6 shadow-2xl">
                        <div className="flex items-center gap-3 text-error mb-4">
                            <AlertTriangle className="w-6 h-6" />
                            <h3 className="text-xl font-bold">{t('profile.security.deleteAccountModal.title')}</h3>
                        </div>
                        <p className="text-sm text-on-surface-variant mb-4">
                            {t('profile.security.deleteAccountModal.description')}
                        </p>
                        <div className="mb-5 p-3 rounded-xl bg-surface-variant/30 border border-outline-variant/20 text-xs text-on-surface-variant space-y-1">
                            <p>{t('profile.security.deleteAccountModal.coolingOffNote')}</p>
                            <p>{t('profile.security.deleteAccountModal.restoreNote')}</p>
                        </div>
                        <div className="space-y-4">
                            <Input
                                type="password"
                                placeholder={t('profile.security.deleteAccountModal.passwordPlaceholder')}
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                            />
                            {deleteError && (
                                <p className="text-xs text-error flex items-start gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                    {deleteError}
                                </p>
                            )}
                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    fullWidth
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeletePassword('');
                                        setDeleteError(null);
                                    }}
                                    disabled={isDeleting}
                                >
                                    {t('profile.security.deleteAccountModal.cancelButton')}
                                </Button>
                                <Button
                                    type="button"
                                    fullWidth
                                    className="bg-error hover:bg-error/80 text-white"
                                    loading={isDeleting}
                                    onClick={handleDeleteAccount}
                                    disabled={!deletePassword}
                                >
                                    {t('profile.security.deleteAccountModal.confirmButton')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ConfirmDialog: Logout All Devices */}
            <ConfirmDialog
                isOpen={showLogoutAllDialog}
                onClose={() => setShowLogoutAllDialog(false)}
                onConfirm={handleLogoutAll}
                title={t('profile.security.logoutConfirmDialog.title')}
                message={t('profile.security.logoutConfirmDialog.message')}
                confirmText={t('profile.security.logoutConfirmDialog.confirmButton')}
                cancelText={t('profile.security.logoutConfirmDialog.cancelButton')}
                variant="warning"
                isLoading={isLoggingOutAll}
            />
        </main>
    );
}
