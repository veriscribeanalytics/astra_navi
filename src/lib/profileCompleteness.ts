export interface ProfileLike {
  id?: string;
  email?: string;
  name?: string | null;
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
}

export function normalizeProfileUser<T extends ProfileLike>(user: T): T {
  return {
    ...user,
    birthPlaceName: user.birthPlaceName ?? user.birth_place_name ?? user.pob ?? '',
    birthLatitude: user.birthLatitude ?? user.birth_latitude ?? undefined,
    birthLongitude: user.birthLongitude ?? user.birth_longitude ?? undefined,
    birthTimezoneName: user.birthTimezoneName ?? user.birth_timezone_name ?? '',
    birthTimezoneOffsetAtBirth:
      user.birthTimezoneOffsetAtBirth ?? user.birth_timezone_offset_at_birth ?? undefined,
  };
}

export function isProfileComplete(user?: ProfileLike | null): boolean {
  if (!user) return false;

  const normalized = normalizeProfileUser(user);
  return Boolean(
    normalized.name &&
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
