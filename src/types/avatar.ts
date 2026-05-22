export interface ChatAvatar {
  avatarId: string;
  name: string;
  title: string;
  description: string;
  expertise: string[];
  personality: string;
  creditCost: number;
  isDefault: boolean;
  /** Optional logical path or future CDN URL for the avatar artwork. May not be hosted yet. */
  imageUrl?: string;
  /** Hex color (e.g. "#6366F1") sourced from the backend catalog. */
  accentColor?: string;
  /** Icon library key (e.g. "sparkles", "briefcase"). FE maps to its icon set, falling back to sparkles. */
  iconKey?: string;
  /** The default mode to pre-select for this avatar. */
  defaultMode?: 'quick' | 'normal' | 'deep';
}

export interface ChatAvatarCatalog {
  defaultAvatarId: string;
  avatars: ChatAvatar[];
}
