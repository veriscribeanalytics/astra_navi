'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogOut, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { AuthShell, AuthHeader, AuthFormCard } from '@/components/auth';

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout('/?logout=success');
    } catch {
      router.replace('/');
    }
  };

  return (
    <AuthShell>
      <div className="w-full max-w-md flex flex-col">
        <AuthHeader
          title="Sign Out"
          subtitle="Are you sure you want to sign out of AstraMitra?"
        />

        <div className="p-4 sm:p-6 pt-0">
          <AuthFormCard>
            <div className="flex flex-col items-center space-y-6 py-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <LogOut className="w-8 h-8 text-amber-500" />
              </div>

              <p className="text-sm text-on-surface-variant text-center leading-relaxed">
                You will be signed out of your account. You can sign back in at any time.
              </p>

              <div className="flex gap-3 w-full">
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  onClick={() => router.back()}
                  disabled={isLoggingOut}
                  className="!rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  fullWidth
                  loading={isLoggingOut}
                  disabled={isLoggingOut}
                  onClick={handleConfirmLogout}
                  className="!rounded-xl font-bold text-[12px] uppercase tracking-widest gap-2 gold-gradient shadow-lg"
                >
                  Sign Out
                  {!isLoggingOut && <ArrowRight size={14} />}
                </Button>
              </div>
            </div>
          </AuthFormCard>
        </div>
      </div>
    </AuthShell>
  );
}