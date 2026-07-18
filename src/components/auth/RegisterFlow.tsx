'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, Lock, ShieldCheck, User as UserIcon, Calendar, Clock,
  Bell, Phone, Sparkles
} from 'lucide-react';
import Input from '@/components/ui/Input';
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
  firstName: string;
  lastName: string;
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

import { ParsedAuthError, parseAuthError, getLocalizedErrorMessage } from '@/utils/authErrorParser';

interface RegisterFlowProps {
  /** Called when registration completes. Receives the data ready to POST to /api/register. */
  onSubmit: (data: Omit<RegisterData, 'confirmPassword'>) => Promise<{ ok: boolean; data: Record<string, unknown>; error?: string; parsedError?: ParsedAuthError | null } | void>;
  /** Whether the whole form should be disabled. */
  disabled?: boolean;
  /** Callback for context-aware CTA redirects. */
  onActionClick?: (action: string) => void;
  /** Optional social auth component (e.g. Google) rendered below the Continue button on Step 0. */
  socialAuth?: React.ReactNode;
}

const minLengthOk = (p: string) => p.length >= 10;
const hasUpper = (p: string) => /[A-Z]/.test(p);
const hasLower = (p: string) => /[a-z]/.test(p);
const hasDigit = (p: string) => /[0-9]/.test(p);
const hasSpecial = (p: string) => /[^A-Za-z0-9]/.test(p);

const RegisterFlow: React.FC<RegisterFlowProps> = ({ onSubmit, disabled = false, onActionClick, socialAuth }) => {
  const { t, language: contextLanguage, setLanguage, availableLanguages } = useTranslation();
  const [step, setStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // DPDP Act 2023 — unbundled consent: separate checkboxes for each purpose
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false);
  // DPDP §6 — Google sign-up must capture affirmative consent before the OAuth
  // handshake (the email path uses the four checkboxes above; the social path
  // skips Steps 1-3, so it needs its own single combined consent here).
  const [googleConsent, setGoogleConsent] = useState(false);
  const [data, setData] = useState<RegisterData>({
    email: '', password: '', confirmPassword: '', firstName: '', lastName: '', gender: '',
    phoneNumber: '', maritalStatus: '', occupation: '',
    dob: '', tob: '', pob: '', birthPlaceName: '',
    birthLatitude: undefined, birthLongitude: undefined, birthTimezoneName: '',
    language: contextLanguage || 'en',
    preferences: { horoscope: true, notifications: false },
  });
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState<ParsedAuthError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // Rate-limit lockout countdown (seconds remaining). While > 0 the submit and
  // back buttons stay disabled so the user can't immediately re-fire a request
  // that would just 429 again. AuthErrorBanner renders the live countdown text.
  const [lockedRemaining, setLockedRemaining] = useState<number>(0);
  const stepContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lockedRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockedRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedRemaining]);

  const isLocked = lockedRemaining > 0;

  useEffect(() => {
    if (isSubmitting) return;
    const timer = setTimeout(() => {
      const container = stepContainerRef.current;
      if (!container) return;
      const firstInput = container.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), button:not([disabled])'
      );
      firstInput?.focus();
    }, 350);
    return () => clearTimeout(timer);
  }, [step, isSubmitting]);

  // Dynamic step labels
  const stepLabels = useMemo(() => [
    t('auth.register.steps.account'),
    t('auth.register.steps.personal'),
    t('auth.register.steps.birth'),
    t('auth.register.steps.preferences')
  ], [t]);

  // Sync language from context
  useEffect(() => {
    setData((prev) => ({ ...prev, language: contextLanguage }));
  }, [contextLanguage]);

  const validateStep = (): string | null => {
    switch (step) {
      case 0: {
        if (!data.email.includes('@')) return t('auth.register.validation.emailInvalid');
        if (!minLengthOk(data.password)) return t('auth.register.validation.passwordLength');
        if (data.password !== data.confirmPassword) return t('auth.register.validation.passwordMismatch');
        if (!hasUpper(data.password)) return t('auth.register.validation.passwordUpper');
        if (!hasLower(data.password)) return t('auth.register.validation.passwordLower');
        if (!hasDigit(data.password)) return t('auth.register.validation.passwordDigit');
        if (!hasSpecial(data.password)) return t('auth.register.validation.passwordSpecial');
        return null;
      }
      case 1: {
        if (data.firstName.trim() && data.firstName.trim().length < 2) return t('auth.register.validation.firstNameLength');
        // Phone is optional, but if provided it must be E.164 (e.g. +919876543210)
        // — matches the backend PhoneStartSchema. A garbage string would otherwise
        // pass client checks and surface later as a generic backend error.
        if (data.phoneNumber.trim() && !/^\+[1-9]\d{6,14}$/.test(data.phoneNumber.trim())) {
          return t('auth.register.validation.phoneInvalid') || 'Enter a valid phone number with country code (e.g. +919876543210).';
        }
        return null;
      }
      case 2: {
        if (data.dob) {
          const d = new Date(data.dob);
          const now = new Date();
          if (d > now) return t('auth.register.validation.dobFuture');
          // 18+ age gate (DPDP children's-data rule)
          const eighteenAgo = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
          if (d > eighteenAgo) return t('login.mustBe18') || 'You must be 18 or older to use Astra Mitra.';
        }
        if (data.tob && !/^\d{2}:\d{2}$/.test(data.tob)) return t('auth.register.validation.tobFormat');
        if (data.pob && data.pob.length < 2) return t('auth.register.validation.pobLength');
        return null;
      }
      default:
        return null;
    }
  };

  const handleContinue = () => {
    const error = validateStep();
    if (error) {
      setStepError(parseAuthError({ message: error }));
      return;
    }
    setStepError(null);
    setFieldErrors({});
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setStepError(null);
    setFieldErrors({});
    try {
      const { confirmPassword: _confirmPassword, ...submitData } = data;
      const res = await onSubmit(submitData);
      if (res && (res.error || res.parsedError)) {
        const parsed = res.parsedError || parseAuthError(res.error);
        // Engage the submit lockout when the backend throttles registration.
        if (parsed.code === 'rate_limited' && parsed.retryAfterSeconds) {
          setLockedRemaining(parsed.retryAfterSeconds);
        }
        if (parsed.field) {
          if (parsed.field === 'email' || parsed.field === 'password') {
            setStep(0);
            setFieldErrors({ [parsed.field]: getLocalizedErrorMessage(parsed, t) });
          } else if (parsed.field === 'firstName' || parsed.field === 'lastName' || parsed.field === 'name') {
            setStep(1);
            setFieldErrors({ [parsed.field === 'name' ? 'firstName' : parsed.field]: getLocalizedErrorMessage(parsed, t) });
          } else if (parsed.field === 'dob' || parsed.field === 'tob' || parsed.field === 'pob') {
            setStep(2);
            setFieldErrors({ [parsed.field]: getLocalizedErrorMessage(parsed, t) });
          } else {
            setStepError(parsed);
          }
        } else {
          setStepError(parsed);
        }
      }
    } catch (err: unknown) {
      const parsed = parseAuthError(err);
      if (parsed.code === 'rate_limited' && parsed.retryAfterSeconds) {
        setLockedRemaining(parsed.retryAfterSeconds);
      }
      if (parsed.field) {
        if (parsed.field === 'email' || parsed.field === 'password') {
          setStep(0);
          setFieldErrors({ [parsed.field]: getLocalizedErrorMessage(parsed, t) });
        } else if (parsed.field === 'name') {
          setStep(1);
          setFieldErrors({ name: getLocalizedErrorMessage(parsed, t) });
        } else if (parsed.field === 'dob' || parsed.field === 'tob' || parsed.field === 'pob') {
          setStep(2);
          setFieldErrors({ [parsed.field]: getLocalizedErrorMessage(parsed, t) });
        } else {
          setStepError(parsed);
        }
      } else {
        setStepError(parsed);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = (field: Partial<RegisterData>) => {
    setData((p) => ({ ...p, ...field }));
    // Clear field-level error when user starts typing/editing
    const fieldKey = Object.keys(field)[0];
    if (fieldKey && fieldErrors[fieldKey]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldKey];
        return copy;
      });
    }
  };

  const strength = useMemo(() => {
    const p = data.password;
    if (!p) return null;
    
    // Check if the password meets the basic length requirement (at least 10 characters)
    if (p.length < 10) {
      return { score: 0, label: t('auth.register.strength.tooShort') || 'Too Short', color: 'bg-white/10', textColor: 'text-[color-mix(in_srgb,var(--on-surface-variant)_50%,transparent)]' };
    }
    
    let metCount = 0;
    if (minLengthOk(p)) metCount++;
    if (hasUpper(p)) metCount++;
    if (hasLower(p)) metCount++;
    if (hasDigit(p)) metCount++;
    if (hasSpecial(p)) metCount++;
    
    if (metCount <= 2) {
      return { score: 1, label: t('auth.register.strength.weak') || 'Weak Password', color: 'bg-red-500', textColor: 'text-red-400' };
    } else if (metCount <= 4) {
      return { score: 2, label: t('auth.register.strength.medium') || 'Medium Password', color: 'bg-orange-500', textColor: 'text-orange-400' };
    } else {
      return { score: 3, label: t('auth.register.strength.strong') || 'Strong Password', color: 'bg-green-500', textColor: 'text-green-400' };
    }
  }, [data.password, t]);

  return (
    <div className="space-y-4">
      {stepError && (
        <AuthErrorBanner
          parsedError={stepError}
          onDismiss={() => setStepError(null)}
          onActionClick={onActionClick}
        />
      )}

      <RegisterStepIndicator currentStep={step} steps={stepLabels} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          ref={stepContainerRef}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="space-y-4"
        >
          {/* Step 0: Account */}
          {step === 0 && (
            <>
              <Input
                variant="cosmic"
                type="email"
                label={t('auth.register.emailLabel')}
                placeholder={t('auth.register.emailPlaceholder')}
                icon={<Mail size={18} className="text-secondary" />}
                value={data.email}
                onChange={(e) => update({ email: e.target.value })}
                error={fieldErrors.email}
                autoComplete="email"
                required
              />
              <PasswordField
                variant="cosmic"
                label={t('auth.register.passwordLabel')}
                placeholder={isMobile ? t('auth.register.passwordLabel') : t('auth.register.passwordPlaceholder')}
                icon={<Lock size={18} className="text-secondary" />}
                value={data.password}
                onChange={(e) => update({ password: e.target.value })}
                error={fieldErrors.password}
                autoComplete="new-password"
                required
              />
              {/* Password strength indicator */}
              {data.password && strength && (
                <div className="space-y-2 px-2 pt-0.5">
                  <div className="flex justify-between items-center text-[10px] font-bold tracking-wider uppercase">
                    <span className="text-[color-mix(in_srgb,var(--on-surface-variant)_50%,transparent)]">
                      {t('auth.register.strength.title') || 'Password Strength'}
                    </span>
                    <span className={strength.textColor}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.color : 'bg-white/10'}`} />
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.color : 'bg-white/10'}`} />
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.color : 'bg-white/10'}`} />
                  </div>
                </div>
              )}
              <PasswordField
                variant="cosmic"
                label={t('auth.register.confirmPasswordLabel')}
                placeholder={isMobile ? t('auth.register.confirmPasswordLabel') : t('auth.register.confirmPasswordPlaceholder')}
                icon={<ShieldCheck size={18} className="text-secondary" />}
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
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <Input
                  variant="cosmic"
                  label={t('auth.register.firstNameLabel')}
                  placeholder={t('auth.register.firstNamePlaceholder')}
                  icon={<UserIcon size={18} className="text-secondary" />}
                  value={data.firstName}
                  onChange={(e) => update({ firstName: e.target.value })}
                  error={fieldErrors.firstName}
                  autoComplete="given-name"
                />
                <Input
                  variant="cosmic"
                  label={t('auth.register.lastNameLabel')}
                  placeholder={t('auth.register.lastNamePlaceholder')}
                  value={data.lastName}
                  onChange={(e) => update({ lastName: e.target.value })}
                  error={fieldErrors.lastName}
                  autoComplete="family-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="space-y-2">
                  <label htmlFor="register-gender" className="auth-label">
                    {t('auth.register.genderLabel')}
                  </label>
                  <select
                    id="register-gender"
                    className="auth-select"
                    value={data.gender}
                    onChange={(e) => update({ gender: e.target.value })}
                  >
                    <option value="">{t('auth.register.selectOption')}</option>
                    <option value="male">{t('auth.register.genderMale')}</option>
                    <option value="female">{t('auth.register.genderFemale')}</option>
                    <option value="other">{t('auth.register.genderOther')}</option>
                    <option value="Not Specified">{t('auth.register.genderNotSpecified')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="register-marital" className="auth-label">
                    {t('auth.register.maritalStatusLabel')}
                  </label>
                  <select
                    id="register-marital"
                    className="auth-select"
                    value={data.maritalStatus}
                    onChange={(e) => update({ maritalStatus: e.target.value })}
                  >
                    <option value="">{t('auth.register.selectOption')}</option>
                    <option value="single">{t('auth.register.maritalSingle')}</option>
                    <option value="married">{t('auth.register.maritalMarried')}</option>
                    <option value="divorced">{t('auth.register.maritalDivorced')}</option>
                    <option value="widowed">{t('auth.register.maritalWidowed')}</option>
                    <option value="separated">{t('auth.register.maritalSeparated')}</option>
                    <option value="Not Specified">{t('auth.register.maritalNotSpecified')}</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="register-occupation" className="auth-label">
                  {t('auth.register.occupationLabel')}
                </label>
                <select
                  id="register-occupation"
                  className="auth-select"
                  value={data.occupation}
                  onChange={(e) => update({ occupation: e.target.value })}
                >
                  <option value="">{t('auth.register.selectOption')}</option>
                  <option value="student">{t('auth.register.occupationStudent')}</option>
                  <option value="business">{t('auth.register.occupationBusiness')}</option>
                  <option value="employed">{t('auth.register.occupationEmployed')}</option>
                  <option value="homemaker">{t('auth.register.occupationHomemaker')}</option>
                  <option value="retired">{t('auth.register.occupationRetired')}</option>
                  <option value="unemployed">{t('auth.register.occupationUnemployed')}</option>
                  <option value="Not Specified">{t('auth.register.occupationNotSpecified')}</option>
                </select>
              </div>
              <Input
                variant="cosmic"
                label={t('auth.register.phoneNumberLabel')}
                placeholder={t('auth.register.phoneNumberPlaceholder')}
                icon={<Phone size={18} className="text-secondary" />}
                value={data.phoneNumber}
                onChange={(e) => update({ phoneNumber: e.target.value })}
                error={fieldErrors.phoneNumber}
                autoComplete="tel"
              />
            </>
          )}

          {/* Step 2: Birth */}
          {step === 2 && (
            <>
              <Input
                variant="cosmic"
                label={t('auth.register.dobLabel')}
                type="date"
                icon={<Calendar size={18} className="text-secondary" />}
                value={data.dob}
                onChange={(e) => update({ dob: e.target.value })}
                error={fieldErrors.dob}
              />
              <Input
                variant="cosmic"
                label={t('auth.register.tobLabel')}
                type="time"
                icon={<Clock size={18} className="text-secondary" />}
                value={data.tob}
                onChange={(e) => update({ tob: e.target.value })}
                error={fieldErrors.tob}
              />
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.18em] text-white font-bold block ml-2">
                  {t('auth.register.pobLabel')}
                </label>
                <LocationSearch
                  placeholder={t('auth.register.pobPlaceholder')}
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
                  error={fieldErrors.pob}
                  helperText={t('auth.register.pobHelperText')}
                />
              </div>
            </>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-6 py-2">
              {/* Language */}
              <div className="space-y-3">
                <label className="auth-label">
                  {t('auth.register.languageLabel')}
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
                      className={`flex items-center justify-center gap-2 py-3 rounded-[18px] border text-[11px] font-bold uppercase tracking-wider transition-all ${
                        data.language === lang.code
                          ? 'bg-secondary/15 border-secondary/40 text-secondary'
                          : 'auth-toggle-bg text-[color-mix(in_srgb,var(--on-surface-variant)_60%,transparent)] hover:text-primary'
                      }`}
                    >
                      {lang.nativeName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferences toggles */}
              <div className="space-y-3">
                <label className="auth-label">
                  {t('auth.register.preferencesLabel')}
                </label>
                <div className="space-y-2">
                  {([
                    { key: 'horoscope' as const, label: t('auth.register.prefHoroscope'), Icon: Sparkles },
                    { key: 'notifications' as const, label: t('auth.register.prefNotifications'), Icon: Bell },
                  ]).map(({ key, label: prefLabel, Icon }) => (
                    <label
                       key={key}
                      className="auth-toggle-bg flex items-center justify-between p-4 transition-all cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg transition-colors ${data.preferences[key] ? 'bg-secondary/20 text-secondary' : 'bg-white/5 text-[color-mix(in_srgb,var(--on-surface-variant)_45%,transparent)]'}`}>
                          <Icon size={14} />
                        </div>
                        <span className="text-sm font-medium text-primary/80">{prefLabel}</span>
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
                        className={`w-8 h-4 rounded-full relative transition-colors ${data.preferences[key] ? 'bg-secondary' : 'bg-[color-mix(in_srgb,var(--on-surface-variant)_20%,transparent)]'}`}
                        aria-hidden="true"
                      >
                        <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${data.preferences[key] ? 'left-5' : 'left-1'}`} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* DPDP Act 2023 — Unbundled Consent Checkboxes */}
              <div className="pt-4 border-t border-[color-mix(in_srgb,var(--secondary)_10%,var(--accent)_25%)] space-y-3.5">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-secondary/70">
                  Required Acknowledgements
                </p>

                {/* 1. Age Gate */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    id="consent-age"
                    type="checkbox"
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[color-mix(in_srgb,var(--secondary)_18%,var(--accent)_30%)] bg-[color-mix(in_srgb,var(--surface-variant)_55%,#0e0a20)] text-secondary focus:ring-secondary/30 focus:ring-2 focus:ring-offset-0 accent-secondary cursor-pointer shrink-0"
                    required
                  />
                  <span className="text-xs text-[color-mix(in_srgb,var(--on-surface-variant)_75%,transparent)] leading-relaxed font-medium font-body">
                    {t('login.consentAge') || 'I confirm that I am 18 years of age or older.'}
                  </span>
                </label>

                {/* 2. Privacy Policy */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    id="consent-privacy"
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[color-mix(in_srgb,var(--secondary)_18%,var(--accent)_30%)] bg-[color-mix(in_srgb,var(--surface-variant)_55%,#0e0a20)] text-secondary focus:ring-secondary/30 focus:ring-2 focus:ring-offset-0 accent-secondary cursor-pointer shrink-0"
                    required
                  />
                  <span className="text-xs text-[color-mix(in_srgb,var(--on-surface-variant)_75%,transparent)] leading-relaxed font-medium font-body">
                    {t('login.consentPrivacy') || 'I have read and understood the'}{' '}
                    <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline font-bold">
                      {t('footer.privacyPolicy') || 'Privacy Policy'}
                    </Link>.
                  </span>
                </label>

                {/* 3. Terms & Conditions */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    id="consent-terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[color-mix(in_srgb,var(--secondary)_18%,var(--accent)_30%)] bg-[color-mix(in_srgb,var(--surface-variant)_55%,#0e0a20)] text-secondary focus:ring-secondary/30 focus:ring-2 focus:ring-offset-0 accent-secondary cursor-pointer shrink-0"
                    required
                  />
                  <span className="text-xs text-[color-mix(in_srgb,var(--on-surface-variant)_75%,transparent)] leading-relaxed font-medium font-body">
                    {t('login.consentTerms') || 'I agree to the'}{' '}
                    <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline font-bold">
                      {t('footer.terms') || 'Terms & Conditions'}
                    </Link>.
                  </span>
                </label>

                {/* 4. Data Processing Consent (DPDP-specific) */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    id="consent-processing"
                    type="checkbox"
                    checked={dataProcessingConsent}
                    onChange={(e) => setDataProcessingConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[color-mix(in_srgb,var(--secondary)_18%,var(--accent)_30%)] bg-[color-mix(in_srgb,var(--surface-variant)_55%,#0e0a20)] text-secondary focus:ring-secondary/30 focus:ring-2 focus:ring-offset-0 accent-secondary cursor-pointer shrink-0"
                    required
                  />
                  <span className="text-xs text-[color-mix(in_srgb,var(--on-surface-variant)_75%,transparent)] leading-relaxed font-medium font-body">
                    {t('login.consentProcessing') || 'I consent to the processing of my personal data, including birth details, for generating Vedic astrological charts, AI-powered readings, and personalized horoscope insights as described in the Privacy Policy. I understand I can withdraw this consent at any time.'}
                  </span>
                </label>

                {/* Inline hint when Create Account is greyed out because not all
                    acknowledgements are checked — replaces a silently-disabled
                    button with an explicit reason the user can act on. */}
                {(!ageConfirmed || !privacyAccepted || !termsAccepted || !dataProcessingConsent) && !isLocked && (
                  <p className="text-[10px] text-secondary/80 leading-relaxed font-medium ml-1 flex items-center gap-1.5">
                    <span aria-hidden="true">↳</span>
                    {t('auth.register.consentRequired') || 'Please confirm all acknowledgements above to create your account.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex gap-3 pt-2">
        {step > 0 && (
          <button
            type="button"
            onClick={() => { setStep((s) => s - 1); setStepError(null); }}
            disabled={isSubmitting || isLocked}
            className="h-[48px] sm:h-[52px] 3xl:h-[84px] px-4 sm:px-5 3xl:px-7 rounded-[18px] 3xl:rounded-[26px] flex items-center justify-center border border-[color-mix(in_srgb,var(--secondary)_18%,var(--accent)_30%)] text-[color-mix(in_srgb,var(--on-surface-variant)_55%,transparent)] hover:text-primary hover:border-[color-mix(in_srgb,var(--secondary)_30%,var(--accent)_45%)] transition-all disabled:opacity-50"
          >
            <ArrowLeft size={18} className="3xl:w-6 3xl:h-6" />
          </button>
        )}
        {step < 3 ? (
          <button
            type="button"
            disabled={disabled || isSubmitting || isLocked}
            onClick={handleContinue}
            className="auth-btn-gold flex-1 h-[48px] sm:h-[52px] 3xl:h-[84px] !rounded-[18px] 3xl:!rounded-[26px] !text-[16px] sm:!text-[18px] 3xl:!text-[28px]"
          >
            {t('auth.register.continue')}
            <ArrowRight size={18} strokeWidth={2.5} className="3xl:w-6 3xl:h-6" />
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled || isSubmitting || isLocked || !ageConfirmed || !privacyAccepted || !termsAccepted || !dataProcessingConsent}
            onClick={handleSubmit}
            className="auth-btn-gold flex-1 h-[48px] sm:h-[52px] 3xl:h-[84px] !rounded-[18px] 3xl:!rounded-[26px] !text-[16px] sm:!text-[18px] 3xl:!text-[28px]"
          >
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : isLocked ? (
              <>
                {t('login.lockedShort') || 'Locked'} ({Math.floor(lockedRemaining / 60)}:{(lockedRemaining % 60).toString().padStart(2, '0')})
              </>
            ) : (
              <>
                {t('auth.register.submit')}
                <ArrowRight size={18} strokeWidth={2.5} className="3xl:w-6 3xl:h-6" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Social auth — only on Step 0 (account creation) */}
      {step === 0 && socialAuth && (
        <>
          <div className="auth-divider">
            <span className="auth-divider-text">
              {t('auth.method.orContinueWith')}
            </span>
          </div>
          {/* DPDP §6 — affirmative consent before the Google OAuth handshake.
              The button is disabled until this is ticked, so no personal data
              is shared with Google / collected without opt-in consent. */}
          <label className="flex items-start gap-3 cursor-pointer select-none mb-3">
            <input
              id="consent-google"
              type="checkbox"
              checked={googleConsent}
              onChange={(e) => setGoogleConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[color-mix(in_srgb,var(--secondary)_18%,var(--accent)_30%)] bg-[color-mix(in_srgb,var(--surface-variant)_55%,#0e0a20)] text-secondary focus:ring-secondary/30 focus:ring-2 focus:ring-offset-0 accent-secondary cursor-pointer shrink-0"
            />
            <span className="text-xs text-[color-mix(in_srgb,var(--on-surface-variant)_75%,transparent)] leading-relaxed font-medium font-body">
              {t('login.consentGooglePart1')}{' '}
              <Link href="/privacy" target="_blank" className="text-secondary hover:underline font-semibold">{t('footer.privacyPolicy')}</Link>
              {' '}{t('login.consentGooglePart2')}{' '}
              <Link href="/terms" target="_blank" className="text-secondary hover:underline font-semibold">{t('footer.terms')}</Link>
              {t('login.consentGooglePart3')}
            </span>
          </label>
          {React.isValidElement(socialAuth)
            ? React.cloneElement(socialAuth as React.ReactElement<{ disabled?: boolean }>, { disabled: !googleConsent })
            : socialAuth}
          {!googleConsent && (
            <p className="text-[10px] text-secondary/80 leading-relaxed font-medium ml-1 mt-2 flex items-center gap-1.5">
              <span aria-hidden="true">↳</span>
              {t('auth.register.consentRequiredGoogle')}
            </p>
          )}
          <p className="text-[9px] text-primary/25 leading-relaxed text-center max-w-[280px] mx-auto mt-2">
            When you sign in with Google, Astra Mitra receives your name and email address.
            See our{' '}
            <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-secondary/50 hover:text-secondary underline underline-offset-2 transition-colors">
              Privacy Policy
            </Link>.
          </p>
        </>
      )}
    </div>
  );
};

export default RegisterFlow;