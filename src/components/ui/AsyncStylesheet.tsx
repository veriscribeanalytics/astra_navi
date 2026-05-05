'use client';

import { useEffect } from 'react';

export default function AsyncStylesheet({ href }: { href: string }) {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'print';
    link.onload = () => { link.media = 'all'; };
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [href]);
  return null;
}
