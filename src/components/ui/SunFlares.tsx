"use client";

import React from 'react';

const SunFlares: React.FC = () => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-10] transition-opacity duration-700 dark:opacity-35 opacity-55">
            {/* Ambient glow container with drop-shadow for soft diffusion */}
            <div 
                className="absolute inset-0"
                style={{
                    filter: 'drop-shadow(0 0 60px rgba(200, 136, 10, 0.2)) drop-shadow(0 0 100px rgba(200, 136, 10, 0.15))',
                }}
            >
                {/* Multiple gradient layers for rich atmospheric effect */}
                <div 
                    className="absolute inset-0"
                    style={{
                        background: `
                            radial-gradient(circle at 15% 15%, rgba(200, 136, 10, 0.35), rgba(200, 136, 10, 0.15) 25%, transparent 45%),
                            radial-gradient(circle at 85% 85%, rgba(150, 100, 200, 0.28), rgba(150, 100, 200, 0.12) 25%, transparent 45%),
                            radial-gradient(circle at 85% 20%, rgba(255, 250, 240, 0.32), rgba(255, 250, 240, 0.15) 20%, transparent 40%),
                            radial-gradient(circle at 50% 50%, rgba(255, 250, 240, 0.25), rgba(200, 136, 10, 0.12) 30%, transparent 50%)
                        `
                    }}
                />
            </div>

            {/* Light mode exclusive ambient layers */}
            <div 
                className="absolute inset-0 dark:hidden"
                style={{
                    background: `
                        radial-gradient(circle at 10% 40%, rgba(200, 136, 10, 0.22), rgba(200, 136, 10, 0.08) 30%, transparent 50%),
                        radial-gradient(circle at 45% 5%, rgba(255, 250, 240, 0.28), rgba(255, 250, 240, 0.12) 25%, transparent 45%)
                    `
                }}
            />
        </div>
    );
};

export default SunFlares;