export interface ChatAvatar {
  avatarId: string;
  name: string;
  title: string;
  description: string;
  expertise: string[];
  personality: string;
  creditCost: number;
  isDefault: boolean;
}

export interface ChatAvatarCatalog {
  defaultAvatarId: string;
  avatars: ChatAvatar[];
}
