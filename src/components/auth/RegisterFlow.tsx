'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, Lock, ShieldCheck, User as UserIcon, Calendar, Clock,
  Bell, Phone, Sparkles
} from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import PasswordField from './PasswordField';
import AuthErrorBanner from './AuthErrorBanner';
import RegisterStepIndicator from './RegisterStepIndicator';
import LocationSearch, { LocationResult } from '@/components/ui/LocationSearch';
import { useTranslation } from '@/hooks';
import { type LanguageCode } from '@/locales';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  gender: string;
  phoneNumber: string;
  maritalStatus: string;
  occupation: string;
  dob: string;
  tob: string;
  pob: string;
  birthPlaceName: string;
  birthLatitude: number | undefined;
  birthLongitude: number | undefined;
  birthTimezoneName: string;
  language: string;
  preferences: { horoscope: boolean; notifications: boolean };
  confirmPassword?: string; // only used for validation, not sent
}

interface RegisterFlowProps {
  /** Called when registration completes. Receives the data ready to POST to /api/register. */
  onSubmit: (data: Omit<RegisterData, 'confirmPassword'>) => Promise<{ ok: boolean; data: Record<string, unknown> } | void>;
  /** Whether the whole form should be disabled. */
  disabled?: boolean;
}

const STEP_LABELS = ['Account', 'Personal', 'Birth', 'Preferences'] as const;

const minLengthOk = (p: string) => p.length >= 10;
const hasUpper = (p: string) => /[A-Z]/.test(p);
const hasLower = (p: string) => /[a-z]/.test(p);
const hasDigit = (p: string) => /[0-9]/.test(p);
const hasSpecial = (p: string) => /[^A-Za-z0-9]/.test(p);

const RegisterFlow: React.FC<RegisterFlowProps> = ({ onSubmit, disabled = false }) => {
  const { t, language: contextLanguage, setLanguage, availableLanguages } = useTranslation();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<RegisterData>({
    email: '', password: '', confirmPassword: '', name: '', gender: '',
    phoneNumber: '', maritalStatus: '', occupation: '',
    dob: '', tob: '', pob: '', birthPlaceName: '',
    birthLatitude: undefined, birthLongitude: undefined, birthTimezoneName: '',
    language: contextLanguage || 'en',
    preferences: { horoscope: true, notifications: false },
  });
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  // Sync language from context
  useEffect(() => {
    setData((prev) => ({ ...prev, language: contextLanguage }));
  }, [contextLanguage]);

  const validateStep = (): string | null => {
    switch (step) {
      case 0: {
        if (!data.email.includes('@')) return 'Please enter a valid email address.';
        if (!minLengthOk(data.password)) return 'Password must be at least 10 characters.';
        if (data.password !== data.confirmPassword) return 'Passwords do not match.';
        if (!hasUpper(data.password)) return 'Password must contain at least one uppercase letter.';
        if (!hasLower(data.password)) return 'Password must contain at least one lowercase letter.';
        if (!hasDigit(data.password)) return 'Password must contain at least one number.';
        if (!hasSpecial(data.password)) return 'Password must contain at least one special character.';
        return null;
      }
      case 1: {
        if (data.name.trim() && data.name.trim().length < 2) return 'Name must be at least 2 characters.';
        return null;
      }
      case 2: {
        if (data.dob) {
          const d = new Date(data.dob);
          if (d > new Date()) return 'Date of birth cannot be in the future.';
        }
        if (data.tob && !/^\d{2}:\d{2}$/.test(data.tob)) return 'Time must be in HH:MM format.';
        if (data.pob && data.pob.length < 2) return 'Place name must be at least 2 characters.';
        return null;
      }
      default:
        return null;
    }
  };

  const handleContinue = () => {
    const error = validateStep();
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setStepError(null);
    try {
      const { confirmPassword: _confirmPassword, ...submitData } = data;
      await onSubmit(submitData);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setStepError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = (field: Partial<RegisterData>) => setData((p) => ({ ...p, ...field }));

  const passwordReqs = [
    { met: minLengthOk(data.password), label: '10+ characters' },
    { met: hasUpper(data.password), label: 'Uppercase letter' },
    { met: hasLower(data.password), label: 'Lowercase letter' },
    { met: hasDigit(data.password), label: 'Number' },
    { met: hasSpecial(data.password), label: 'Special character' },
  ];

  return (
    <div className="space-y-4">
      {stepError && (
        <AuthErrorBanner message={stepError} onDismiss={() => setStepError(null)} />
      )}

      <RegisterStepIndicator currentStep={step} steps={[...STEP_LABELS]} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="space-y-4"
        >
          {/* Step 0: Account */}
          {step === 0 && (
            <>
              <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                icon={<Mail size={14} className="text-secondary" />}
                value={data.email}
                onChange={(e) => update({ email: e.target.value })}
                autoComplete="email"
                required
              />
              <PasswordField
                label="Password"
                placeholder="Create a strong password"
                icon={<Lock size={14} className="text-secondary" />}
                value={data.password}
                onChange={(e) => update({ password: e.target.value })}
                autoComplete="new-password"
                required
              />
              {/* Password requirements */}
              <div className="space-y-1.5 p-3 rounded-xl bg-surface-variant/20 border border-outline-variant/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">Password Requirements</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {passwordReqs.map((req) => (
                    <div key={req.label} className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${req.met ? 'bg-green-400' : 'bg-outline-variant/40'}`} />
                      <span className={`text-[10px] ${req.met ? 'text-green-400' : 'text-on-surface-variant/40'}`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <PasswordField
                label="Confirm Password"
                placeholder="Re-enter your password"
                icon={<ShieldCheck size={14} className="text-secondary" />}
                value={data.confirmPassword || ''}
                onChange={(e) => update({ confirmPassword: e.target.value })}
                autoComplete="new-password"
                required
              />
            </>
          )}

          {/* Step 1: Personal */}
          {step === 1 && (
            <>
              <Input
                label={t('login.fullName') || 'Full Name'}
                placeholder="Enter your full name"
                icon={<UserIcon size={14} className="text-secondary" />}
                value={data.name}
                onChange={(e) => update({ name: e.target.value })}
                autoComplete="name"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 block">
                    Gender
                  </label>
                  <select
                    className="w-full h-11 bg-surface border border-outline-variant/30 rounded-xl px-4 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all appearance-none cursor-pointer font-body"
                    value={data.gender}
                    onChange={(e) => update({ gender: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="Not Specified">Not Specified</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 block">
                    Status
                  </label>
                  <select
                    className="w-full h-11 bg-surface border border-outline-variant/30 rounded-xl px-4 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all appearance-none cursor-pointer font-body"
                    value={data.maritalStatus}
                    onChange={(e) => update({ maritalStatus: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                    <option value="separated">Separated</option>
                    <option value="Not Specified">Prefer not to say</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 block">
                  Occupation
                </label>
                <select
                  className="w-full h-11 bg-surface border border-outline-variant/30 rounded-xl px-4 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all appearance-none cursor-pointer font-body"
                  value={data.occupation}
                  onChange={(e) => update({ occupation: e.target.value })}
                >
                  <option value="">Select</option>
                  <option value="student">Student</option>
                  <option value="business">Business Owner</option>
                  <option value="employed">Employed / Salaried</option>
                  <option value="homemaker">Homemaker</option>
                  <option value="retired">Retired</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="Not Specified">Prefer not to say</option>
                </select>
              </div>
              <Input
                label="Phone Number"
                placeholder="Enter phone number (optional)"
                icon={<Phone size={14} className="text-secondary" />}
                value={data.phoneNumber}
                onChange={(e) => update({ phoneNumber: e.target.value })}
                autoComplete="tel"
              />
            </>
          )}

          {/* Step 2: Birth */}
          {step === 2 && (
            <>
              <Input
                label={t('login.dob') || 'Date of Birth'}
                type="date"
                icon={<Calendar size={14} className="text-secondary" />}
                value={data.dob}
                onChange={(e) => update({ dob: e.target.value })}
              />
              <Input
                label={t('login.tob') || 'Time of Birth'}
                type="time"
                icon={<Clock size={14} className="text-secondary" />}
                value={data.tob}
                onChange={(e) => update({ tob: e.target.value })}
              />
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 block ml-1">
                  {t('login.pob') || 'Place of Birth'}
                </label>
                <LocationSearch
                  placeholder="Search city, e.g. Delhi"
                  value={data.pob || data.birthPlaceName}
                  onSelect={(location: LocationResult) => {
                    update({
                      pob: location.name,
                      birthPlaceName: location.name,
                      birthLatitude: location.lat,
                      birthLongitude: location.lon,
                      birthTimezoneName: location.timezone,
                    });
                    setSelectedLocation(location);
                  }}
                  onChange={(text: string) => {
                    update({ pob: text });
                    if (selectedLocation?.name !== text) {
                      update({
                        birthPlaceName: '',
                        birthLatitude: undefined,
                        birthLongitude: undefined,
                        birthTimezoneName: '',
                      });
                      setSelectedLocation(null);
                    }
                  }}
                  confirmedLocation={selectedLocation}
                  helperText="Search and select your exact birth location"
                />
              </div>
            </>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-6 py-2">
              {/* Language */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 block">
                  {t('login.preferredLanguage') || 'Preferred Language'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code as LanguageCode);
                        setData({ ...data, language: lang.code });
                      }}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all ${
                        data.language === lang.code
                          ? 'bg-secondary/10 border-secondary text-secondary'
                          : 'bg-surface-variant/20 border-outline-variant/10 text-primary/40 hover:bg-surface-variant/40'
                      }`}
                    >
                      {lang.nativeName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferences toggles */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 block">
                  Preferences
                </label>
                <div className="space-y-2">
                  {([
                    { key: 'horoscope' as const, label: t('login.receiveHoroscope') || 'Receive daily horoscope', Icon: Sparkles },
                    { key: 'notifications' as const, label: t('login.enableNotifications') || 'Enable notifications', Icon: Bell },
                  ]).map(({ key, label: prefLabel, Icon }) => (
                    <label
                      key={key}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-variant/20 border border-outline-variant/10 hover:bg-surface-variant/40 transition-all cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg transition-colors ${data.preferences[key] ? 'bg-secondary/20 text-secondary' : 'bg-white/10 text-primary/40'}`}>
                          <Icon size={14} />
                        </div>
                        <span className="text-xs font-medium text-primary/70">{prefLabel}</span>
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={data.preferences[key]}
                        onChange={() => setData({
                          ...data,
                          preferences: { ...data.preferences, [key]: !data.preferences[key] },
                        })}
                      />
                      <div
                        className={`w-8 h-4 rounded-full relative transition-colors ${data.preferences[key] ? 'bg-secondary' : 'bg-on-surface-variant/20'}`}
                        aria-hidden="true"
                      >
                        <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${data.preferences[key] ? 'left-5' : 'left-1'}`} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex gap-3 pt-2">
        {step > 0 && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => { setStep((s) => s - 1); setStepError(null); }}
            disabled={isSubmitting}
            className="!rounded-xl px-4 border border-outline-variant/20"
          >
            <ArrowLeft size={16} />
          </Button>
        )}
        {step < 3 ? (
          <Button
            type="button"
            fullWidth
            size="md"
            disabled={disabled || isSubmitting}
            onClick={handleContinue}
            className="!rounded-xl font-bold text-[12px] uppercase tracking-widest gap-2 gold-gradient shadow-lg"
          >
            {t('login.next') || 'Continue'}
            <ArrowRight size={14} />
          </Button>
        ) : (
          <Button
            type="button"
            fullWidth
            size="md"
            loading={isSubmitting}
            disabled={disabled || isSubmitting}
            onClick={handleSubmit}
            className="!rounded-xl font-bold text-[12px] uppercase tracking-widest gap-2 gold-gradient shadow-lg"
          >
            {t('login.createAccount') || 'Create Account'}
            <ArrowRight size={14} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default RegisterFlow;