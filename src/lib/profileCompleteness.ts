export interface ProfileLike {
  id?: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  username?: string | null;
  discoverable?: boolean | null;
  dob?: string | null;
  tob?: string | null;
  pob?: string | null;
  birthPlaceName?: string | null;
  birthLatitude?: number | null;
  birthLongitude?: number | null;
  birthTimezoneName?: string | null;
  birthTimezoneOffsetAtBirth?: number | null;
  birth_place_name?: string | null;
  birth_latitude?: number | null;
  birth_longitude?: number | null;
  birth_timezone_name?: string | null;
  birth_timezone_offset_at_birth?: number | null;
  profileImageUrl?: string | null;
  profile_image_url?: string | null;
  chatAvatarImageUrl?: string | null;
  chat_avatar_image_url?: string | null;
}

export function normalizeProfileUser<T extends ProfileLike>(user: T): T {
  const firstName = user.firstName ?? user.first_name ?? null;
  const lastName = user.lastName ?? user.last_name ?? null;
  return {
    ...user,
    firstName,
    lastName,
    name: user.name ?? ([firstName, lastName].filter(Boolean).join(' ') || null),
    birthPlaceName: user.birthPlaceName ?? user.birth_place_name ?? user.pob ?? '',
    birthLatitude: user.birthLatitude ?? user.birth_latitude ?? undefined,
    birthLongitude: user.birthLongitude ?? user.birth_longitude ?? undefined,
    birthTimezoneName: user.birthTimezoneName ?? user.birth_timezone_name ?? '',
    birthTimezoneOffsetAtBirth:
      user.birthTimezoneOffsetAtBirth ?? user.birth_timezone_offset_at_birth ?? undefined,
    profileImageUrl: user.profileImageUrl ?? user.profile_image_url ?? null,
    chatAvatarImageUrl: user.chatAvatarImageUrl ?? user.chat_avatar_image_url ?? null,
  };
}

export function isProfileComplete(user?: ProfileLike | null): boolean {
  if (!user) return false;

  const normalized = normalizeProfileUser(user);
  return Boolean(
    (normalized.firstName || normalized.name) &&
      normalized.lastName &&
      normalized.dob &&
      normalized.tob &&
      normalized.pob &&
      typeof normalized.birthLatitude === 'number' &&
      typeof normalized.birthLongitude === 'number' &&
      normalized.birthTimezoneName
  );
}

export function resolveProfileComplete(
  backendProfileComplete: unknown,
  user?: ProfileLike | null
): boolean {
  return backendProfileComplete === true || isProfileComplete(user);
}
