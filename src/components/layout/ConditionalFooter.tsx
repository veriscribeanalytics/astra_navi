'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Footer from './Footer';

const ConditionalFooter = () => {
    const pathname = usePathname();
    const { isLoggedIn, isLoading } = useAuth();

    // Routes where footer is NEVER shown — auth pages, full-screen overlays
    const neverFooterRoutes = ['/login', '/logout', '/forgot-password', '/reset-password', '/intro'];

    // Routes where footer is shown only when logged OUT.
    // Logged-out state renders PublicFeatureLanding (marketing page) where
    // footer links (Privacy, Terms, About) add trust and help conversion.
    // Logged-in state renders interactive app features needing full screen.
    const loggedOutFooterRoutes = [
        { prefix: '/', exact: true },
        { prefix: '/chat', exact: false },
        { prefix: '/consult', exact: false },
        { prefix: '/kundli', exact: false },
        { prefix: '/horoscope', exact: false },
        { prefix: '/family', exact: false },
        { prefix: '/profile', exact: false },
        { prefix: '/plans', exact: false },
        { prefix: '/plan', exact: false },
    ];

    // Routes where footer is NEVER shown regardless of auth state.
    // Interactive app-like pages with no marketing/landing fallback.
    const alwaysNoFooterRoutes = ['/rashis', '/notifications'];

    const isNeverFooter = neverFooterRoutes.some(route => pathname.startsWith(route));
    const isAlwaysNoFooter = alwaysNoFooterRoutes.some(route => pathname.startsWith(route));

    const isLoggedOutFooterRoute = loggedOutFooterRoutes.some(({ prefix, exact }) =>
        exact ? pathname === prefix : pathname.startsWith(prefix)
    );

    if (isNeverFooter || isAlwaysNoFooter) return null;
    if (isLoggedOutFooterRoute && (isLoggedIn || isLoading)) return null;

    return <Footer />;
};

export default ConditionalFooter;