'use client';

import Link from "next/link";
import React, { useState, useRef, useEffect, cloneElement } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Button from "../ui/Button";
import ThemeToggle from "./ThemeToggle";
import LanguagePicker from "../ui/LanguagePicker";
import ConfirmDialog from "../ui/ConfirmDialog";
import NotificationBell from "./NotificationBell";
import { useAuth } from "@/context/AuthContext";
import { useToast, useTranslation } from "@/hooks";
import {
    User, LogOut, Menu, X, ChevronDown, Sparkles,
    BookOpen, MessageSquare, Heart, Compass, LayoutDashboard,
    Gem, ShieldQuestion, Brain, Globe, Wallet, TrendingUp, Users
} from "lucide-react";
import { usePaywallContext } from "@/context/PaywallContext";
import { getTierLabel } from "@/types/billing";

// Navigation structure based on auth state
const getNavSections = (isLoggedIn: boolean, t: (key: string) => string) => {
    if (isLoggedIn) {
        return [
            {
                id: "destiny",
                label: t('nav.myJourney'),
                items: [
                    { 
                        label: t('nav.cosmicDashboard'), 
                        href: "/", 
                        icon: <LayoutDashboard className="w-4 h-4" />,
                        desc: t('nav.cosmicDashboardDesc')
                    },
                    {
                        label: t('nav.myKundli'),
                        href: "/kundli",
                        icon: <Globe className="w-4 h-4" />,
                        desc: t('nav.myKundliDesc')
                    },
                    {
                        label: t('nav.chartMatching'),
                        href: "/kundli/match",
                        icon: <Heart className="w-4 h-4" />,
                        desc: t('nav.chartMatchingDesc')
                    },
                    {
                        label: t('nav.forecast'),
                        href: "/horoscope/forecast",
                        icon: <TrendingUp className="w-4 h-4" />,
                        desc: t('nav.forecastDesc')
                    },
                    {
                        label: t('nav.myFamily'),
                        href: "/family",
                        icon: <Users className="w-4 h-4" />,
                        desc: t('nav.myFamilyDesc')
                    },
                ]
            },
            {
                id: "consult",
                label: t('nav.consultNavi'),
                items: [
                    {
                        label: t('nav.guidedSessions'),
                        href: "/consult",
                        icon: <Sparkles className="w-4 h-4" />,
                        desc: t('nav.guidedSessionsDesc')
                    },
                    {
                        label: t('nav.chatWithNavi'),
                        href: "/chat",
                        icon: <MessageSquare className="w-4 h-4" />,
                        desc: t('nav.chatWithNaviDesc')
                    },
                ]
            },
            {
                id: "knowledge",
                label: t('nav.knowledge'),
                items: [
                    { 
                        label: t('nav.encyclopedia'), 
                        href: "/blogs", 
                        icon: <BookOpen className="w-4 h-4" />,
                        desc: t('nav.encyclopediaDesc')
                    },
                    { 
                        label: t('nav.the12Rashis'), 
                        href: "/rashis", 
                        icon: <Sparkles className="w-4 h-4" />,
                        desc: t('nav.the12RashisDesc')
                    },
                    { 
                        label: t('nav.theNavagraha'), 
                        href: "/blogs/planets", 
                        icon: <Compass className="w-4 h-4" />,
                        desc: t('nav.theNavagrahaDesc')
                    },
                    { 
                        label: t('nav.the12Houses'), 
                        href: "/blogs/houses", 
                        icon: <Gem className="w-4 h-4" />,
                        desc: t('nav.the12HousesDesc')
                    },
                    { 
                        label: t('nav.the27Nakshatras'), 
                        href: "/blogs/nakshatras", 
                        icon: <Sparkles className="w-4 h-4" />,
                        desc: t('nav.the27NakshatrasDesc')
                    },
                    { 
                        label: t('nav.planetaryYogas'), 
                        href: "/blogs/yogas", 
                        icon: <BookOpen className="w-4 h-4" />,
                        desc: t('nav.planetaryYogasDesc')
                    },
                ]
            },
            {
                id: "community",
                label: t('nav.community'),
                items: [
                    { 
                        label: t('nav.naviAiModels'), 
                        href: "/chat", 
                        icon: <Brain className="w-4 h-4" />,
                        desc: t('nav.naviAiModelsDesc')
                    },
                    { 
                        label: t('nav.helpSupport'), 
                        href: "/support", 
                        icon: <ShieldQuestion className="w-4 h-4" />,
                        desc: t('nav.helpSupportDesc')
                    },
                ]
            }
        ];
    }

    // Public / Logged Out View
    return [
        {
            id: "explore",
            label: t('nav.platform'),
            items: [
                { 
                    label: t('nav.cosmicDashboard'), 
                    href: "/", 
                    icon: <Compass className="w-4 h-4" />,
                    desc: t('nav.cosmicDashboardDesc')
                },
                { 
                    label: t('nav.ourMission'), 
                    href: "/about", 
                    icon: <User className="w-4 h-4" />,
                    desc: t('nav.ourMissionDesc')
                },
                { 
                    label: t('nav.naviAiModels'), 
                    href: "/chat", 
                    icon: <Brain className="w-4 h-4" />,
                    desc: t('nav.naviAiModelsDesc')
                },            
            ]
        },
        {
            id: "horoscope",
            label: t('nav.astrology'),
            items: [
                { 
                    label: t('nav.birthChart'), 
                    href: "/kundli", 
                    icon: <BookOpen className="w-4 h-4" />,
                    desc: t('nav.birthChartDesc')
                },
                { 
                    label: t('nav.chartMatching'), 
                    href: "/kundli/match", 
                    icon: <Heart className="w-4 h-4" />,
                    desc: t('nav.chartMatchingDesc')
                },
                { 
                    label: t('nav.zodiacSigns'), 
                    href: "/rashis", 
                    icon: <Sparkles className="w-4 h-4" />,
                    desc: t('nav.zodiacSignsDesc')
                },
            ]
        },
        {
            id: "knowledge",
            label: t('nav.knowledge'),
            items: [
                { 
                    label: t('nav.encyclopedia'), 
                    href: "/blogs", 
                    icon: <BookOpen className="w-4 h-4" />,
                    desc: t('nav.encyclopediaDesc')
                },
                { 
                    label: t('nav.the12Rashis'), 
                    href: "/rashis", 
                    icon: <Sparkles className="w-4 h-4" />,
                    desc: t('nav.the12RashisDesc')
                },
                { 
                    label: t('nav.theNavagraha'), 
                    href: "/blogs/planets", 
                    icon: <Compass className="w-4 h-4" />,
                    desc: t('nav.theNavagrahaDesc')
                },
                { 
                    label: t('nav.the12Houses'), 
                    href: "/blogs/houses", 
                    icon: <Gem className="w-4 h-4" />,
                    desc: t('nav.the12HousesDesc')
                },
                { 
                    label: t('nav.the27Nakshatras'), 
                    href: "/blogs/nakshatras", 
                    icon: <Sparkles className="w-4 h-4" />,
                    desc: t('nav.the27NakshatrasDesc')
                },
                { 
                    label: t('nav.planetaryYogas'), 
                    href: "/blogs/yogas", 
                    icon: <BookOpen className="w-4 h-4" />,
                    desc: t('nav.planetaryYogasDesc')
                },
            ]
        },
        {
            id: "services",
            label: t('nav.services'),
            items: [
                {
                    label: t('nav.chatWithNavi'),
                    href: "/chat",
                    icon: <MessageSquare className="w-4 h-4" />,
                    desc: t('nav.chatWithNaviDesc')
                },
                {
                    label: t('nav.guidedSessions'),
                    href: "/consult", 
                    icon: <Compass className="w-4 h-4" />,
                    desc: t('nav.guidedSessionsDesc')
                },
                { 
                    label: t('nav.astraNaviPremium'), 
                    href: "/plans", 
                    icon: <Sparkles className="w-4 h-4" />,
                    desc: t('nav.astraNaviPremiumDesc')
                },
            ]
        }
    ];
};

const Navbar: React.FC = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { isLoggedIn, isLoading, logout, user } = useAuth();
    const { ToastContainer } = useToast();
    const { t } = useTranslation();
    const { tier, totalCredits, isLoaded } = usePaywallContext();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [hoveredSection, setHoveredSection] = useState<string | null>(null);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const desktopUserDropdownRef = useRef<HTMLDivElement>(null);
    const mobileUserDropdownRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLElement>(null);
    
    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        const setHeight = () => {
            document.documentElement.style.setProperty('--navbar-height', `${nav.offsetHeight}px`);
        };
        setHeight();
        const observer = new ResizeObserver(setHeight);
        observer.observe(nav);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isOutsideDesktop = !desktopUserDropdownRef.current || !desktopUserDropdownRef.current.contains(target);
            const isOutsideMobile = !mobileUserDropdownRef.current || !mobileUserDropdownRef.current.contains(target);
            
            if (isOutsideDesktop && isOutsideMobile) {
                setIsUserDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const prevPathnameRef = useRef(pathname);
    useEffect(() => {
        if (prevPathnameRef.current !== pathname) {
            prevPathnameRef.current = pathname;
            setIsMenuOpen(false);
            setIsUserDropdownOpen(false);
            setHoveredSection(null);
        }
    }, [pathname]);

    const isChatPage = pathname?.startsWith('/chat');
    // Only hide the navbar on /chat when the user is actually signed in
    // (because the authed chat UI has its own header). Anon users see the
    // PublicFeatureLanding teaser and must keep the navbar so they can
    // navigate away.
    const hideNavbar = isChatPage && isLoggedIn;
    const navSections = getNavSections(isLoggedIn, t);

    const handleLogout = () => {
        setIsUserDropdownOpen(false);
        setIsMenuOpen(false);
        setShowLogoutDialog(true);
    };

    const confirmLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout('/?logout=success');
        } catch (err) {
            console.error('Logout failed:', err);
            router.replace('/');
        } finally {
            setIsLoggingOut(false);
            setShowLogoutDialog(false);
        }
    };
    
    const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const isMenuButton = target.getAttribute('role') === 'menuitem' && target.tagName === 'BUTTON';
        const isMenuLink = target.getAttribute('role') === 'menuitem' && target.tagName === 'A';
        
        if (!isMenuButton && !isMenuLink) return;

        const menubar = e.currentTarget;
        const allButtons = Array.from(menubar.querySelectorAll('button[role="menuitem"]'));
        
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            if (isMenuButton) {
                const idx = allButtons.indexOf(target);
                let nextIdx = e.key === 'ArrowRight' ? idx + 1 : idx - 1;
                if (nextIdx >= allButtons.length) nextIdx = 0;
                if (nextIdx < 0) nextIdx = allButtons.length - 1;
                (allButtons[nextIdx] as HTMLElement).focus();
            }
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (isMenuButton && e.key === 'ArrowDown') {
                const sectionId = navSections[allButtons.indexOf(target)]?.id;
                if (hoveredSection !== sectionId) {
                    setHoveredSection(sectionId);
                    setTimeout(() => {
                        const firstLink = menubar.querySelector(`#menu-${sectionId} a[role="menuitem"]`) as HTMLElement;
                        firstLink?.focus();
                    }, 50);
                } else {
                    const firstLink = menubar.querySelector(`#menu-${sectionId} a[role="menuitem"]`) as HTMLElement;
                    firstLink?.focus();
                }
            } else if (isMenuLink) {
                const menu = target.closest('[role="menu"]');
                if (menu) {
                    const links = Array.from(menu.querySelectorAll('a[role="menuitem"]'));
                    const idx = links.indexOf(target);
                    let nextIdx = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
                    if (nextIdx >= links.length) nextIdx = 0;
                    if (nextIdx < 0) nextIdx = links.length - 1;
                    (links[nextIdx] as HTMLElement).focus();
                }
            }
        } else if (e.key === 'Escape') {
            setHoveredSection(null);
            if (isMenuLink) {
                const menu = target.closest('[role="menu"]');
                const sectionId = menu?.id.replace('menu-', '');
                const parentBtn = allButtons.find(b => b.getAttribute('aria-controls') === `menu-${sectionId}`);
                (parentBtn as HTMLElement)?.focus();
            }
        }
    };

    const isActive = (path:string) => pathname == path;

    return(
        <>
            {ToastContainer}
            <ConfirmDialog
                isOpen={showLogoutDialog}
                onClose={() => setShowLogoutDialog(false)}
                onConfirm={confirmLogout}
                title={t('nav.logoutConfirmTitle')}
                message={t('nav.logoutConfirmMessage')}
                confirmText={t('nav.signOut')}
                cancelText={t('common.cancel')}
                variant="warning"
                isLoading={isLoggingOut}
            />
            <nav ref={navRef} className={`fixed top-0 w-full z-[210] bg-surface border-b border-outline-variant/30 transition-all duration-500 ${hideNavbar ? 'hidden' : ''}`}>
            {/* ===== DESKTOP NAVBAR (lg+) ===== */}
            <div className="hidden lg:flex items-center justify-between px-4 sm:px-8 lg:px-12 py-2 w-full mx-auto max-w-[1600px] 2xl:max-w-[2000px] 3xl:max-w-[2400px]">
                {/* Left: Logo */}
                <div className="flex justify-start shrink-0">
                    <Link href="/" aria-label="Astra Navi Home" className="flex shrink-0 items-center justify-center text-lg lg:text-xl font-bold tracking-tighter text-primary font-headline whitespace-nowrap">
                        <Image src="/icons/logo.jpeg" alt="" height={26} width={26} style={{ width: "auto", height: "auto" }} className="object-contain mr-2.5 rounded-lg shadow-sm shadow-secondary/10" priority />
                        Astra Navi
                    </Link>
                </div>

                {/* Center: Navigation Dropdowns */}
                <div className="flex items-center justify-center space-x-1.5 lg:space-x-3 flex-1 px-4" role="menubar" onKeyDown={handleMenuKeyDown}>
                    {navSections.map((section) => (
                        <div 
                            key={section.id}
                            className="relative"
                            onMouseEnter={() => setHoveredSection(section.id)}
                            onMouseLeave={() => setHoveredSection(null)}
                            onFocus={() => setHoveredSection(section.id)}
                            onBlur={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                    setHoveredSection(null);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') setHoveredSection(null);
                            }}
                            role="none"
                        >
                            <button 
                                role="menuitem"
                                aria-haspopup="true"
                                aria-expanded={hoveredSection === section.id}
                                aria-controls={`menu-${section.id}`}
                                onClick={() => setHoveredSection(hoveredSection === section.id ? null : section.id)}
                                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-full transition-all duration-300 font-body font-bold text-[11px] lg:text-[12px] tracking-widest uppercase whitespace-nowrap ${hoveredSection === section.id ? 'text-secondary bg-secondary/5' : 'text-primary/70 hover:text-primary'}`}
                            >
                                {section.label}
                                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${hoveredSection === section.id ? 'rotate-180 text-secondary' : 'opacity-30'}`} />
                            </button>

                            {/* Mega Dropdown Bridge */}
                            <div id={`menu-${section.id}`} className={`absolute top-full left-1/2 -translate-x-1/2 pt-4 transition-all duration-300 transform ${hoveredSection === section.id ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible pointer-events-none'}`} role="menu">
                                {/* Hover Bridge Pseudo-element */}
                                <div className="absolute top-0 left-0 w-full h-4 -translate-y-full" />
                                
                                <div className="w-[300px] lg:w-[340px] p-2 bg-surface/95 backdrop-blur-xl rounded-[24px] border border-outline-variant/30 shadow-2xl shadow-black/40">
                                    <div className="space-y-1">
                                        {section.items.map((item, idx) => {
                                            return (
                                                <Link 
                                                    key={idx} 
                                                    href={item.href}
                                                    role="menuitem"
                                                    aria-label={`${item.label}: ${item.desc}`}
                                                    className={`group flex items-start gap-4 p-3 rounded-2xl transition-all duration-200 ${isActive(item.href) ? 'bg-secondary/10' : 'hover:bg-secondary/5'}`}
                                                >
                                                    <div className={`mt-0.5 w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border transition-all duration-300 ${isActive(item.href) ? 'bg-secondary text-on-primary border-secondary' : 'bg-secondary/5 text-secondary border-secondary/10 group-hover:bg-secondary/10 group-hover:border-secondary/30'}`}>
                                                        {item.icon}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`text-[13px] font-headline font-semibold tracking-wide ${isActive(item.href) ? 'text-secondary' : 'text-primary'}`}>
                                                            {item.label}
                                                        </span>
                                                        <span className="text-[11px] text-on-surface-variant/60 leading-relaxed mt-1 line-clamp-2">
                                                            {item.desc}
                                                        </span>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end space-x-4 lg:space-x-5">
                    <LanguagePicker />
                    <ThemeToggle />
                    {isLoading ? (
                        <div className="w-9 h-9 rounded-full bg-secondary/5 border border-secondary/10 animate-pulse" aria-hidden="true" />
                    ) : !isLoggedIn ? (
                        <div className="flex items-center gap-2">
                            <Link
                                href={`/login?callbackUrl=${encodeURIComponent(pathname || '/')}`}
                                className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary/70 hover:text-secondary transition-colors whitespace-nowrap"
                            >
                                {t('nav.login')}
                            </Link>
                            <Button
                                href={`/login?action=register&callbackUrl=${encodeURIComponent(pathname || '/')}`}
                                variant="primary"
                                size="sm"
                                className="!px-4 shadow-md shadow-secondary/10 text-xs whitespace-nowrap"
                            >
                                {t('nav.signUp')}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 lg:gap-4">
                        <NotificationBell />
                        <div className="relative z-50" ref={desktopUserDropdownRef}>
                            <button
                                aria-haspopup="true"
                                aria-expanded={isUserDropdownOpen}
                                className="profile-ring-glow cursor-pointer"
                                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                            >
                                <div className="profile-comet-dot" aria-hidden="true"></div>
                                <div className="profile-avatar-content !text-sm">{(user?.name?.[0] || user?.email?.[0] || 'S').toUpperCase()}</div>
                            </button>
                            {isUserDropdownOpen && (
                                <div role="menu" aria-label={t('nav.account')} className="absolute top-[calc(100%+8px)] right-0 w-60 bg-surface border border-outline-variant/30 rounded-2xl shadow-xl p-2 z-[150] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3.5 mb-2 border-b border-primary/5">
                                        <p className="text-[10px] text-primary/40 uppercase tracking-[0.2em] font-bold">{t('nav.account')}</p>
                                        <p className="text-sm font-bold text-primary truncate mt-0.5">{user?.name || user?.email?.split('@')[0] || t('common.user')}</p>
                                    </div>
                                    {/* Credit Balance */}
                                    {isLoggedIn && isLoaded && (
                                        <div className="px-4 py-2.5 mb-2 border-b border-primary/5 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <Wallet className="w-3.5 h-3.5 text-secondary shrink-0" />
                                                <span className="text-[10px] font-bold text-secondary tabular-nums whitespace-nowrap shrink-0">{totalCredits ?? 0}</span>
                                                <span className="text-[9px] text-foreground/30 uppercase tracking-wider whitespace-nowrap truncate">{t('plans.naviCredits')}</span>
                                            </div>
                                            <span className="text-[8px] font-bold text-secondary/60 uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-secondary/10 border border-secondary/15 whitespace-nowrap shrink-0">{getTierLabel(tier || 'free')}</span>
                                        </div>
                                    )}
                                    <div className="space-y-0.5">
                                        <Link href="/plans" onClick={() => setIsUserDropdownOpen(false)} className="w-full flex items-center px-4 py-3 text-sm text-primary/75 hover:text-secondary hover:bg-secondary/10 rounded-xl transition-all font-medium">
                                            <Sparkles className="w-4 h-4 mr-3.5 opacity-60" /> {t('nav.astraNaviPremium')}
                                        </Link>
                                        <Link href="/profile" onClick={() => setIsUserDropdownOpen(false)} className="w-full flex items-center px-4 py-3 text-sm text-primary/75 hover:text-secondary hover:bg-secondary/10 rounded-xl transition-all font-medium">
                                            <User className="w-4 h-4 mr-3.5 opacity-60" /> {t('common.userProfile')}
                                        </Link>
                                        <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-medium">
                                            <LogOut className="w-4 h-4 mr-3.5 opacity-60" /> {t('nav.signOut')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ===== MOBILE NAVBAR (<lg) ===== */}
            <div className="flex lg:hidden items-center px-4 py-2 w-full relative h-[56px]">
                {/* Left Section (33%) */}
                <div className="flex-[1] flex justify-start">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)} 
                        className="p-2.5 -ml-2 text-primary/80 hover:text-primary transition-all rounded-xl hover:bg-primary/5 active:scale-90"
                    >
                        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Center Section - Prevent overlap on extra-narrow screens by hiding "Astra Navi" text below 390px */}
                <div className="absolute left-1/2 -translate-x-1/2 flex justify-center pointer-events-auto">
                    <Link href="/" className="flex items-center gap-2 text-base font-bold tracking-tighter text-primary font-headline">
                        <Image src="/icons/logo.jpeg" alt="Astra Navi Logo" height={24} width={24} style={{ width: "auto", height: "auto" }} className="object-contain rounded-md" priority />
                        <span className="whitespace-nowrap hidden min-[390px]:inline">Astra Navi</span>
                    </Link>
                </div>

                {/* Right Section */}
                <div className="flex-[1] flex justify-end items-center gap-2.5 sm:gap-3">
                    <ThemeToggle />
                    {isLoading ? (
                        <div className="h-8 w-[68px] rounded-xl bg-secondary/5 border border-secondary/10 animate-pulse" aria-hidden="true" />
                    ) : !isLoggedIn ? (
                        <Link
                            href={`/login?callbackUrl=${encodeURIComponent(pathname || '/')}`}
                            className="h-8 px-3.5 rounded-xl bg-secondary text-on-primary text-[11px] font-bold uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm shadow-secondary/20"
                        >
                            <User className="w-3.5 h-3.5" />
                            {t('nav.login')}
                        </Link>
                    ) : (
                        <>
                        <NotificationBell />
                        <div className="relative z-50" ref={mobileUserDropdownRef}>
                            <button className="profile-ring-glow !w-8 !h-8 cursor-pointer border-none bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 p-0" onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} aria-label="User menu" aria-expanded={isUserDropdownOpen}>
                                <div className="profile-comet-dot" aria-hidden="true"></div>
                                <div className="profile-avatar-content !text-[10px] font-bold">{(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}</div>
                            </button>
                            {isUserDropdownOpen && (
                                <div role="menu" aria-label={t('nav.account')} className="absolute top-[56px] right-0 w-60 bg-surface border border-outline-variant/30 rounded-2xl shadow-xl p-2 z-[150] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3.5 mb-2 border-b border-primary/5">
                                        <p className="text-[10px] text-primary/40 uppercase tracking-[0.2em] font-bold">{t('nav.account')}</p>
                                        <p className="text-sm font-bold text-primary truncate mt-0.5">{user?.name || user?.email?.split('@')[0] || t('common.user')}</p>
                                    </div>
                                    {/* Credit Balance */}
                                    {isLoggedIn && isLoaded && (
                                        <div className="px-4 py-2.5 mb-2 border-b border-primary/5 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <Wallet className="w-3.5 h-3.5 text-secondary shrink-0" />
                                                <span className="text-[10px] font-bold text-secondary tabular-nums whitespace-nowrap shrink-0">{totalCredits ?? 0}</span>
                                                <span className="text-[9px] text-foreground/30 uppercase tracking-wider whitespace-nowrap truncate">{t('plans.naviCredits')}</span>
                                            </div>
                                            <span className="text-[8px] font-bold text-secondary/60 uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-secondary/10 border border-secondary/15 whitespace-nowrap shrink-0">{getTierLabel(tier || 'free')}</span>
                                        </div>
                                    )}
                                    <div className="space-y-0.5">
                                        <Link href="/plans" onClick={() => setIsUserDropdownOpen(false)} className="w-full flex items-center px-4 py-3 text-sm text-primary/75 hover:text-secondary hover:bg-secondary/10 rounded-xl transition-all font-medium">
                                            <Sparkles className="w-4 h-4 mr-3.5 opacity-60" /> {t('nav.astraNaviPremium')}
                                        </Link>
                                        <Link href="/profile" onClick={() => setIsUserDropdownOpen(false)} className="w-full flex items-center px-4 py-3 text-sm text-primary/75 hover:text-secondary hover:bg-secondary/10 rounded-xl transition-all font-medium">
                                            <User className="w-4 h-4 mr-3.5 opacity-60" /> {t('common.userProfile')}
                                        </Link>
                                        <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-medium">
                                            <LogOut className="w-4 h-4 mr-3.5 opacity-60" /> {t('nav.signOut')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        </>
                    )}
                </div>
            </div>

            {/* ===== SITE MENU OVERLAY (Mobile) ===== */}
            <div className={`lg:hidden fixed inset-0 top-[var(--navbar-height,56px)] bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-500 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)} />
            
            <div className={`lg:hidden fixed top-[var(--navbar-height,56px)] left-0 right-0 max-h-[calc(100vh-var(--navbar-height,56px))] bg-surface border-b border-secondary/15 shadow-2xl z-[105] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-y-auto ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
                <div className="p-5 space-y-7 pb-12">
                    {navSections.map((section) => (
                        <div key={section.id} className="space-y-3">
                            <h3 className="text-[10px] font-bold text-secondary uppercase tracking-[0.25em] px-3 opacity-80">{section.label}</h3>
                            <div className="grid grid-cols-1 gap-1">
                                {section.items.map((item, idx) => {
                                    return (
                                        <Link key={idx} href={item.href} onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all active:scale-[0.98] ${isActive(item.href) ? 'bg-secondary/10' : 'hover:bg-primary/5'}`}>
                                            <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-colors ${isActive(item.href) ? 'bg-secondary text-on-primary' : 'bg-secondary/10 text-secondary'}`}>
                                                {cloneElement(item.icon as React.ReactElement<Record<string, unknown>>, { size: 18 })}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className={`text-[13px] font-bold tracking-tight ${isActive(item.href) ? 'text-secondary' : 'text-primary'}`}>
                                                    {item.label}
                                                </span>
                                                {item.desc && (
                                                    <span className="text-[10px] text-on-surface-variant/50 leading-tight mt-0.5 truncate pr-2">
                                                        {item.desc}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Preferences Row (Language Picker) on Mobile */}
                    <div className="pt-5 border-t border-outline-variant/30 flex items-center justify-between">
                        <span className="text-xs font-bold text-primary/60 uppercase tracking-wider">{t('profile.basicInfo.language')}</span>
                        <LanguagePicker />
                    </div>

                    {!isLoggedIn && (
                        <div className="pt-2">
                            <Button href="/login" onClick={() => setIsMenuOpen(false)} fullWidth size="lg" className="rounded-2xl shadow-lg shadow-secondary/20 font-bold tracking-wider">{t('nav.getStarted')}</Button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
        </>
    )
}    

export default Navbar;    
