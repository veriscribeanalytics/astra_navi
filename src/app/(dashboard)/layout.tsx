'use client';

import React from 'react';

/**
 * Dashboard Layout
 * 
 * Note: Route protection is handled by middleware in src/auth.config.ts.
 * This layout provides the shared shell for all dashboard pages.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-shell">
      {children}
    </div>
  );
}
