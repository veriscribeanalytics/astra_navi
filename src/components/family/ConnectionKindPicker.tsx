'use client';

import React from 'react';
import { Users, Heart, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/hooks';
import type { FamilyConnectionKind, FamilyRelationshipType } from '@/types/family';

/** Relationship options shown when kind === 'family'. Mirrors the backend's
 *  accepted relationshipType values (minus 'friend', which is implied by the
 *  Friend toggle). */
const RELATIONSHIP_TYPES: { value: FamilyRelationshipType; labelKey: string; fallback: string }[] = [
    { value: 'mother', labelKey: 'mother', fallback: 'Mother' },
    { value: 'father', labelKey: 'father', fallback: 'Father' },
    { value: 'son', labelKey: 'son', fallback: 'Son' },
    { value: 'daughter', labelKey: 'daughter', fallback: 'Daughter' },
    { value: 'sibling', labelKey: 'sibling', fallback: 'Sibling' },
    { value: 'spouse', labelKey: 'spouse', fallback: 'Spouse' },
    { value: 'other', labelKey: 'other', fallback: 'Other' },
];

interface ConnectionKindPickerProps {
    kind: FamilyConnectionKind;
    onKindChange: (kind: FamilyConnectionKind) => void;
    /** Relationship value; only meaningful + required when kind === 'family'. */
    relationshipType: FamilyRelationshipType;
    onRelationshipChange: (rel: FamilyRelationshipType) => void;
    disabled?: boolean;
    /** Hide the section heading when the surrounding card already has one. */
    hideHeading?: boolean;
}

/**
 * Neutral "Add a connection" control: a Family / Friend segmented toggle plus the
 * relationship-type picker, which is only shown (and only required) for the
 * Family kind. For Friend, the backend forces the label to "friend", so the
 * caller should send `kind:'friend'` with no relationshipType.
 */
const ConnectionKindPicker: React.FC<ConnectionKindPickerProps> = ({
    kind, onKindChange, relationshipType, onRelationshipChange, disabled, hideHeading,
}) => {
    const { t } = useTranslation();

    const segBtn = (active: boolean) =>
        `flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[18px] text-[12px] font-bold uppercase tracking-wider transition-colors border ${
            active
                ? 'bg-secondary text-white border-secondary'
                : 'bg-secondary/5 text-secondary border-secondary/20 hover:bg-secondary/10'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`;

    return (
        <div className="space-y-3">
            {!hideHeading && (
                <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 block">
                    {t('family.addConnection') || 'Add a connection'}
                </label>
            )}
            <div className="flex gap-2">
                <button type="button" onClick={() => onKindChange('family')} className={segBtn(kind === 'family')} aria-pressed={kind === 'family'}>
                    <Users className="w-3.5 h-3.5" />
                    {t('family.connectionKindFamily') || 'Family'}
                </button>
                <button type="button" onClick={() => onKindChange('friend')} className={segBtn(kind === 'friend')} aria-pressed={kind === 'friend'}>
                    <Heart className="w-3.5 h-3.5" />
                    {t('family.connectionKindFriend') || 'Friend'}
                </button>
            </div>

            {kind === 'family' ? (
                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 block">
                        {t('family.inviteRelationshipLabel') || 'Relationship'}
                        <span className="text-secondary ml-1">*</span>
                    </label>
                    <div className="relative">
                        <select
                            value={relationshipType}
                            disabled={disabled}
                            onChange={(e) => onRelationshipChange(e.target.value as FamilyRelationshipType)}
                            className="w-full appearance-none bg-surface border border-outline-variant/30 rounded-[20px] sm:rounded-[24px] px-3 sm:px-4 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base text-primary pr-10 disabled:opacity-50"
                        >
                            {RELATIONSHIP_TYPES.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {t(`family.relationshipTypes.${r.labelKey}`) || r.fallback}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40" />
                    </div>
                </div>
            ) : (
                <p className="text-[11px] text-on-surface-variant/65 ml-1">
                    {t('family.friendKindHint') || 'Friends are unlimited and never count against your roster.'}
                </p>
            )}
        </div>
    );
};

export default ConnectionKindPicker;
