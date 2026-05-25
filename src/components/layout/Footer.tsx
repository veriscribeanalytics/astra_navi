import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import Input from '../ui/Input';
import { useTranslation } from '@/hooks';

const Footer = () => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    // Reusable "Coming Soon" badge — replaces the `cursor-not-allowed opacity`
    // pattern which made disabled items look click-able. Visually distinct
    // and self-explanatory, no hover-tooltip required.
    const ComingSoonBadge = () => (
        <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary/10 border border-secondary/20 text-[8px] font-bold text-secondary uppercase tracking-widest whitespace-nowrap">
            <Sparkles className="w-2 h-2" />
            {t('common.comingSoon')}
        </span>
    );

    return (
        <footer className="w-full pt-8 sm:pt-14 pb-6 sm:pb-8 px-4 sm:px-8 lg:px-12 bg-background border-t border-secondary/10 relative z-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 w-full max-w-7xl 2xl:max-w-[1800px] 3xl:max-w-[2400px] mx-auto">
                <div className="col-span-2 md:col-span-1 space-y-3 sm:space-y-4">
                    <div className="font-headline text-xl sm:text-2xl text-primary font-bold">Astra Navi</div>
                    <p className="text-xs text-primary/60 font-medium leading-relaxed max-w-[240px]">
                        {t('footer.tagline')}
                    </p>
                    {/* Social links removed until real URLs are provided — the
                        previous icons linked to "#" which produced dead clicks. */}
                </div>

                <div>
                    <h5 className="font-bold text-primary mb-3 sm:mb-5 uppercase tracking-widest text-[10px] sm:text-xs">{t('footer.services')}</h5>
                    <ul className="space-y-2 sm:space-y-3 font-body text-xs sm:text-sm text-primary/60 font-medium">
                        <li><Link className="hover:text-secondary transition-colors" href="/chat">{t('nav.consultNavi')}</Link></li>
                        <li><Link className="hover:text-secondary transition-colors" href="/rashis">{t('nav.zodiacSigns')}</Link></li>
                        <li><Link className="hover:text-secondary transition-colors" href="/kundli">{t('nav.birthChart')}</Link></li>
                        <li className="flex items-center text-on-surface-variant/40">
                            <span>{t('footer.sacredItems')}</span>
                            <ComingSoonBadge />
                        </li>
                    </ul>
                </div>

                <div>
                    <h5 className="font-bold text-primary mb-3 sm:mb-5 uppercase tracking-widest text-[10px] sm:text-xs">{t('footer.companyInfo')}</h5>
                    <ul className="space-y-2 sm:space-y-3 font-body text-xs sm:text-sm text-primary/60 font-medium">
                        <li><Link className="hover:text-secondary transition-colors" href="/about">{t('footer.aboutUs')}</Link></li>
                        <li><Link className="hover:text-secondary transition-colors" href="/astrologers">{t('footer.ourAstrologers')}</Link></li>
                        <li className="flex items-center text-on-surface-variant/40">
                            <span>{t('footer.careers')}</span>
                            <ComingSoonBadge />
                        </li>
                        <li><Link className="hover:text-secondary transition-colors" href="/support">{t('footer.contactSupport')}</Link></li>
                    </ul>
                </div>

                <div className="col-span-2 md:col-span-1">
                    <h5 className="font-bold text-primary mb-3 sm:mb-5 uppercase tracking-widest text-[10px] sm:text-xs">{t('footer.stayConnected')}</h5>
                    <p className="text-xs sm:text-sm text-primary/60 font-medium mb-3 sm:mb-4">{t('footer.newsletterDesc')}</p>
                    <div className="mt-3 sm:mt-5 relative flex items-center group opacity-60" title={t('common.comingSoon')}>
                        <Input
                            placeholder="your@cosmos.com"
                            type="email"
                            disabled
                            className="!py-3 !rounded-xl !pr-14 sm:!pr-16 border-secondary/20 !bg-surface cursor-not-allowed"
                        />
                        <button disabled className="gold-gradient flex items-center justify-center text-white h-9 w-9 sm:h-10 sm:w-10 rounded-xl shrink-0 absolute right-1.5 cursor-not-allowed">
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 font-bold" />
                        </button>
                    </div>
                    <div className="mt-2">
                        <ComingSoonBadge />
                    </div>
                </div>
            </div>

            <div className="mt-8 sm:mt-12 pt-6 border-t border-secondary/5 text-center">
                <p
                    className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] font-body font-bold"
                    style={{ color: 'rgba(212, 160, 23, 0.5)' }}
                >
                    © {currentYear} Astra Navi. {t('footer.copyright')}
                </p>
            </div>
        </footer>
    );
};

export default Footer;
