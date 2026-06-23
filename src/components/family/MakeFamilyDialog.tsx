'use client';

import React, { useState } from 'react';
import { Users, ChevronDown, Loader2 } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';
import { useTranslation, useToast } from '@/hooks';
import { updateConnection, mergeConnection } from '@/hooks/useFamily';
import type { FamilyConnection, FamilyRelationshipType, FamilyMergeCandidate } from '@/types/family';
import { parseInviteErrorByStatus, familyCapDetail, familyPeerTierCapDetail, type FamilyCapDetail } from '@/lib/familyInviteErrors';

/** Relationship label options for promoting a connection to family. */
const RELATIONSHIP_TYPES: { value: FamilyRelationshipType; labelKey: string; fallback: string }[] = [
    { value: 'mother', labelKey: 'mother', fallback: 'Mother' },
    { value: 'father', labelKey: 'father', fallback: 'Father' },
    { value: 'son', labelKey: 'son', fallback: 'Son' },
    { value: 'daughter', labelKey: 'daughter', fallback: 'Daughter' },
    { value: 'sibling', labelKey: 'sibling', fallback: 'Sibling' },
    { value: 'spouse', labelKey: 'spouse', fallback: 'Spouse' },
    { value: 'friend', labelKey: 'friend', fallback: 'Friend' },
    { value: 'other', labelKey: 'other', fallback: 'Other' },
];

interface MakeFamilyDialogProps {
    /** Open state — render the dialog when true. */
    open: boolean;
    connection: FamilyConnection;
    onClose: () => void;
    /** Called with the updated connection after sharing is enabled (and merge,
     *  if confirmed, completes). */
    onUpdated: (updated: FamilyConnection) => void;
    /** Surfaces a FAMILY_FREE_TIER_CAP 402 so the parent can open its cap dialog. */
    onFreeTierCap?: (detail: FamilyCapDetail) => void;
}

/**
 * Promotes a connection to family: pick a relationship label and enable sharing
 * in a single PATCH. If the label matches a manual family member, follow up with
 * a merge confirmation. The pair only appears as "family" once the other side
 * also shares — that's enforced by the backend's `isFamily` flag.
 */
const MakeFamilyDialog: React.FC<MakeFamilyDialogProps> = ({
    open, connection, onClose, onUpdated, onFreeTierCap,
}) => {
    const { t } = useTranslation();
    const { success: toastSuccess, error: toastError } = useToast();

    const [relationship, setRelationship] = useState<FamilyRelationshipType>(
        connection.iSeeThemAs ?? 'mother'
    );
    const [isSaving, setIsSaving] = useState(false);
    const [mergeCandidate, setMergeCandidate] = useState<FamilyMergeCandidate | null>(null);
    const [isMerging, setIsMerging] = useState(false);

    const handleConfirm = async () => {
        setIsSaving(true);
        const res = await updateConnection(connection.connectionId, {
            sharingWithThem: true,
            relationshipOverride: relationship,
        });
        setIsSaving(false);
        if (!res.ok || !res.data) {
            const cap = familyCapDetail(res.raw);
            const peerCap = familyPeerTierCapDetail(res.raw);
            if (cap) {
                onFreeTierCap?.(cap);
                onClose();
                return;
            }
            if (peerCap) {
                toastError(peerCap.message || "They can't be added as family right now — their list is full.");
                return;
            }
            toastError(parseInviteErrorByStatus(res.status, res.raw, t));
            return;
        }
        // Merge candidate? Keep the dialog mounted and switch to the merge prompt.
        if (res.mergeCandidate) {
            onUpdated(res.data);
            setMergeCandidate(res.mergeCandidate);
            return;
        }
        toastSuccess(t('family.makeFamilySuccess') || 'Sharing enabled.');
        onUpdated(res.data);
        onClose();
    };

    const handleConfirmMerge = async () => {
        if (!mergeCandidate) return;
        setIsMerging(true);
        const res = await mergeConnection(connection.connectionId, mergeCandidate.memberId);
        setIsMerging(false);
        if (res.ok && res.data) {
            toastSuccess(t('family.inviteStatusAccepted') || 'Linked.');
            onUpdated(res.data);
        } else {
            toastError(parseInviteErrorByStatus(res.status, res.raw, t));
        }
        setMergeCandidate(null);
        onClose();
    };

    const skipMerge = () => {
        setMergeCandidate(null);
        onClose();
    };

    if (!open) return null;

    // Stage 2: a manual member matched the label — offer to link them.
    if (mergeCandidate) {
        return (
            <ConfirmDialog
                isOpen={true}
                onClose={skipMerge}
                onConfirm={handleConfirmMerge}
                title={t('family.inviteMergeTitle') || 'Merge with existing entry?'}
                message={(t('family.inviteMergeBody') || 'You already have a manual entry for {name} (born {dob}). Merge it into this connection?')
                    .replace('{name}', mergeCandidate.name)
                    .replace('{dob}', mergeCandidate.dob)}
                confirmText={t('family.inviteMergeConfirm') || 'Merge'}
                cancelText={t('family.inviteMergeCancel') || 'Keep both'}
                variant="warning"
                isLoading={isMerging}
            />
        );
    }

    // Stage 1: pick a relationship label, then enable sharing.
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-md rounded-3xl bg-surface border border-outline-variant/20 shadow-2xl p-6"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shrink-0">
                        <Users className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-base font-headline font-bold text-primary truncate">
                            {(t('family.makeFamilyTitle') || 'Add {name} to family')
                                .replace('{name}', connection.otherName || connection.otherEmail)}
                        </h3>
                        <p className="text-[12px] text-on-surface-variant/65">
                            {t('family.makeFamilyDesc') || 'Pick how you know them and turn on sharing.'}
                        </p>
                    </div>
                </div>

                <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 block mb-2">
                    {t('family.inviteRelationshipLabel') || 'Relationship'}
                    <span className="text-secondary ml-1">*</span>
                </label>
                <div className="relative">
                    <select
                        value={relationship}
                        disabled={isSaving}
                        onChange={(e) => setRelationship(e.target.value as FamilyRelationshipType)}
                        className="w-full appearance-none bg-surface border border-outline-variant/30 rounded-2xl px-4 py-3 text-sm text-primary pr-10 disabled:opacity-50"
                    >
                        {RELATIONSHIP_TYPES.map((r) => (
                            <option key={r.value} value={r.value}>
                                {t(`family.relationshipTypes.${r.labelKey}`) || r.fallback}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40" />
                </div>

                <p className="mt-3 text-[11px] text-on-surface-variant/60 leading-relaxed">
                    {(t('family.makeFamilyHint') || "They become family once {name} also enables sharing from their side.")
                        .replace('{name}', connection.otherName || connection.otherEmail)}
                </p>

                <div className="mt-5 flex justify-end gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
                        {t('common.cancel') || 'Cancel'}
                    </Button>
                    <Button type="button" size="sm" onClick={handleConfirm} disabled={isSaving}>
                        {isSaving ? (
                            <span className="inline-flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t('family.makeFamilySaving') || 'Enabling…'}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {t('family.makeFamilyConfirm') || 'Enable sharing'}
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MakeFamilyDialog;
