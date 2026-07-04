import { COMPATIBILITY_LANGS, type CompatibilityLang } from '@/types/family';

/**
 * Map the app's UI language (11 locales) to a language the family
 * compatibility backend translates to (en/hi/ko/ta/te/kn/bn/mr/pa).
 *
 * The compatibility backend supports 9 languages; the two app locales it
 * doesn't support yet (Gujarati `gu`, Malayalam `ml`) fall back to English so
 * the reading stays readable. Use this wherever a compatibility/summary/report
 * endpoint is called so the content language tracks the app's UI language.
 */
export function appLangToCompatLang(appLang: string | null | undefined): CompatibilityLang {
    if (appLang && (COMPATIBILITY_LANGS as readonly string[]).includes(appLang)) {
        return appLang as CompatibilityLang;
    }
    return 'en';
}
