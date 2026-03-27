'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Footer from './Footer';

const ConditionalFooter = () => {
    const pathname = usePathname();
    
    // List of routes where we DON'T want the footer
    const noFooterRoutes = ['/chat', '/login'];
    
    // Check if the current path starts with any of the restricted routes
    const isDashboard = noFooterRoutes.some(route => pathname.startsWith(route));

    if (isDashboard) return null;

    return <Footer />;
};

export default ConditionalFooter;
