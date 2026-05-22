'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

import { ParsedAuthError, parseAuthError, getLocalizedErrorMessage } from '@/utils/authErrorParser';

interface RegisterFlowProps {
  /** Called when registration completes. Receives the data ready to POST to /api/register. */
  onSubmit: (data: Omit<RegisterData, 'confirmPassword'>) => Promise<{ ok: boolean; data: Record<string, unknown>; error?: string; parsedError?: ParsedAuthError | null } | void>;
  /** Whether the whole form should be disabled. */
  disabled?: boolean;
  /** Callback for context-aware CTA redirects. */
  onActionClick?: (action: string) => void;
}

const minLengthOk = (p: string) => p.length >= 10;
const hasUpper = (p: string) => /[A-Z]/.test(p);
const hasLower = (p: string) => /[a-z]/.test(p);
const hasDigit = (p: string) => /[0-9]/.test(p);
const hasSpecial = (p: string) => /[^A-Za-z0-9]/.test(p);

const RegisterFlow: React.FC<RegisterFlowProps> = ({ onSubmit, disabled = false, onActionClick }) => {
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
  const [stepError, setStepError] = useState<ParsedAuthError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
        if (data.name.trim() && data.name.trim().length < 2) return t('auth.register.validation.nameLength');
        return null;
      }
      case 2: {
        if (data.dob) {
          const d = new Date(data.dob);
          if (d > new Date()) return t('auth.register.validation.dobFuture');
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
      }
    } catch (err: unknown) {
      const parsed = parseAuthError(err);
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

  const passwordReqs = useMemo(() => [
    { met: minLengthOk(data.password), label: t('auth.register.reqs.length') },
    { met: hasUpper(data.password), label: t('auth.register.reqs.upper') },
    { met: hasLower(data.password), label: t('auth.register.reqs.lower') },
    { met: hasDigit(data.password), label: t('auth.register.reqs.digit') },
    { met: hasSpecial(data.password), label: t('auth.register.reqs.special') },
  ], [data.password, t]);

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
                label={t('auth.register.emailLabel')}
                placeholder={t('auth.register.emailPlaceholder')}
                icon={<Mail size={14} className="text-secondary" />}
                value={data.email}
                onChange={(e) => update({ email: e.target.value })}
                error={fieldErrors.email}
                autoComplete="email"
                required
              />
              <PasswordField
                label={t('auth.register.passwordLabel')}
                placeholder={t('auth.register.passwordPlaceholder')}
                icon={<Lock size={14} className="text-secondary" />}
                value={data.password}
                onChange={(e) => update({ password: e.target.value })}
                error={fieldErrors.password}
                autoComplete="new-password"
                required
              />
              {/* Password requirements */}
              <div className="space-y-1.5 p-3 rounded-xl bg-surface-variant/20 border border-outline-variant/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
                  {t('auth.register.reqs.title')}
                </p>
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
                label={t('auth.register.confirmPasswordLabel')}
                placeholder={t('auth.register.confirmPasswordPlaceholder')}
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
                label={t('auth.register.fullNameLabel')}
                placeholder={t('auth.register.fullNamePlaceholder')}
                icon={<UserIcon size={14} className="text-secondary" />}
                value={data.name}
                onChange={(e) => update({ name: e.target.value })}
                error={fieldErrors.name}
                autoComplete="name"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 block">
                    {t('auth.register.genderLabel')}
                  </label>
                  <select
                    className="w-full h-11 bg-surface border border-outline-variant/30 rounded-xl px-4 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all appearance-none cursor-pointer font-body"
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
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 block">
                    {t('auth.register.maritalStatusLabel')}
                  </label>
                  <select
                    className="w-full h-11 bg-surface border border-outline-variant/30 rounded-xl px-4 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all appearance-none cursor-pointer font-body"
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
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 block">
                  {t('auth.register.occupationLabel')}
                </label>
                <select
                  className="w-full h-11 bg-surface border border-outline-variant/30 rounded-xl px-4 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all appearance-none cursor-pointer font-body"
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
                label={t('auth.register.phoneNumberLabel')}
                placeholder={t('auth.register.phoneNumberPlaceholder')}
                icon={<Phone size={14} className="text-secondary" />}
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
                label={t('auth.register.dobLabel')}
                type="date"
                icon={<Calendar size={14} className="text-secondary" />}
                value={data.dob}
                onChange={(e) => update({ dob: e.target.value })}
                error={fieldErrors.dob}
              />
              <Input
                label={t('auth.register.tobLabel')}
                type="time"
                icon={<Clock size={14} className="text-secondary" />}
                value={data.tob}
                onChange={(e) => update({ tob: e.target.value })}
                error={fieldErrors.tob}
              />
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 block ml-1">
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
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 block">
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
                  {t('auth.register.preferencesLabel')}
                </label>
                <div className="space-y-2">
                  {([
                    { key: 'horoscope' as const, label: t('auth.register.prefHoroscope'), Icon: Sparkles },
                    { key: 'notifications' as const, label: t('auth.register.prefNotifications'), Icon: Bell },
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
            {t('auth.register.continue')}
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
            {t('auth.register.submit')}
            <ArrowRight size={14} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default RegisterFlow;