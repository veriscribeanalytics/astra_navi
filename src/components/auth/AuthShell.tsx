'use client';

import React, { useRef, useState, useEffect } from 'react';

interface AuthShellProps {
  children: React.ReactNode;
  /** Enables the interactive mouse-glow radial gradient effect. Defaults to false. */
  mouseGlow?: boolean;
  /** When true, children stretch to fill the full height (for multi-panel layouts like /login). */
  fullHeight?: boolean;
  /** Extra classes applied to the root container. */
  className?: string;
}

const AuthShell: React.FC<AuthShellProps> = ({ children, mouseGlow = false, fullHeight = false, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!mouseGlow) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseGlow]);

  return (
    <div
      ref={containerRef}
      className={`min-h-[calc(100dvh-var(--navbar-height,64px))] w-full flex ${fullHeight ? 'items-stretch' : 'items-center justify-center'} relative overflow-hidden font-body bg-transparent px-4 ${className}`}
    >
      {mouseGlow && (
        <div
          className="pointer-events-none absolute z-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle, var(--secondary) 0%, transparent 70%)',
            left: mousePos.x - 300,
            top: mousePos.y - 300,
          }}
        />
      )}
      <div className={`relative z-10 ${fullHeight ? 'min-h-[calc(100dvh-var(--navbar-height,64px))] w-full' : ''}`}>{children}</div>
    </div>
  );
};

export default AuthShell;
