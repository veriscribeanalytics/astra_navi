"use client";

/**
 * CosmicTree — a "Tree of Life" backdrop for the overall daily score.
 * Uses the tree.svg silhouette from resources/icons, recoloured to the
 * dashboard's violet + gold palette. viewBox is cropped tight to the tree.
 */
export default function CosmicTree({ className }: { className?: string }) {
  return (
    <svg
      viewBox="150 30 730 940"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Cosmic Tree"
    >
      <defs>
        <radialGradient id="ct-canopy" cx="518" cy="340" r="380" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="60%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#5B21B6" />
        </radialGradient>
        <radialGradient id="ct-canopy-light" cx="420" cy="300" r="300" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#A78BFA" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ct-trunk-g" x1="518" y1="580" x2="518" y2="960" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#6D3FA0" />
          <stop offset="100%" stopColor="#432876" />
        </linearGradient>
        <linearGradient id="ct-soil" x1="518" y1="940" x2="518" y2="970" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B1F6E" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#160D2E" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="ct-aura" cx="518" cy="380" r="380" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#6D28D9" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#4C1D95" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ct-gold" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FBE6B0" />
          <stop offset="45%" stopColor="#E8B54A" />
          <stop offset="100%" stopColor="#C9972E" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ct-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0E0722" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0E0722" stopOpacity="0" />
        </radialGradient>

        <filter id="ct-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="ct-glow-soft" x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ===== Aura backdrop ===== */}
      <ellipse cx="518" cy="380" rx="340" ry="300" fill="url(#ct-aura)" />

      {/* ===== Ground shadow ===== */}
      <ellipse cx="518" cy="950" rx="160" ry="18" fill="url(#ct-shadow)" />
      <path d="M360 948 Q518 970 676 948 L676 960 Q518 975 360 960 Z" fill="url(#ct-soil)" />

      {/* ===== Tree silhouette (from tree.svg) — recoloured ===== */}
      <path d="M517.800604 48.725076c-197.993958 0-358.864048 146.94864-358.864048 328.700906 0 181.752266 160.870091 328.700906 358.864048 328.700906 197.993958 0 358.864048-146.94864 358.864049-328.700906C876.664653 196.44713 715.794562 48.725076 517.800604 48.725076z" fill="#7C3AED" />
      <path d="M517.800604 48.725076c-197.993958 0-358.864048 146.94864-358.864048 328.700906 0 181.752266 160.870091 328.700906 358.864048 328.700906 197.993958 0 358.864048-146.94864 358.864049-328.700906C876.664653 196.44713 715.794562 48.725076 517.800604 48.725076z" fill="url(#ct-canopy)" />
      <path d="M517.800604 60.326284c-30.163142-1.546828-149.268882 12.374622-240.531722 87.39577-44.858006 36.350453-105.957704 128.386707-109.051359 235.117825-4.640483 219.649547 198.767372 283.8429 198.767371 283.8429S308.978852 653.534743 247.10574 573.873112c-54.912387-70.380665-61.099698-237.438066 49.49849-366.598188C401.015106 85.848943 517.800604 60.326284 517.800604 60.326284z" fill="url(#ct-canopy-light)" />
      <path d="M622.984894 951.299094c-16.241692 51.818731-164.73716 41.76435-154.682779 1.546827 24.749245-98.223565 58.006042-208.048338 44.858006-256-4.640483-18.561934-46.404834-22.429003-109.05136-26.296072-37.897281-2.320242-104.410876-34.030211-133.02719-88.169184-6.960725-13.148036 42.537764 18.561934 80.435045 41.76435 37.897281 22.429003 80.435045 32.483384 148.495469 34.803625 3.867069 0-42.537764-10.054381-85.075529-28.616314-42.537764-18.561934-67.287009-65.740181-62.646526-84.302115 2.320242-10.054381 18.561934 23.975831 75.021148 64.193354 35.577039 24.749245 103.637462 47.178248 126.839879 38.670695 84.302115-31.70997 105.18429-139.987915 114.465257-118.332326 24.749245 61.873112-62.646526 112.145015-72.700906 119.10574-8.507553 6.187311 37.123867 3.867069 106.731118-28.616314 23.975831-11.601208 105.957704-74.247734 92.036253-51.818732C728.942598 673.643505 599.782477 657.401813 581.993958 690.65861 548.73716 754.07855 628.398792 935.830816 622.984894 951.299094z" fill="#6D3FA0" />
      <path d="M622.984894 951.299094c-16.241692 51.818731-164.73716 41.76435-154.682779 1.546827 24.749245-98.223565 58.006042-208.048338 44.858006-256-4.640483-18.561934-46.404834-22.429003-109.05136-26.296072-37.897281-2.320242-104.410876-34.030211-133.02719-88.169184-6.960725-13.148036 42.537764 18.561934 80.435045 41.76435 37.897281 22.429003 80.435045 32.483384 148.495469 34.803625 3.867069 0-42.537764-10.054381-85.075529-28.616314-42.537764-18.561934-67.287009-65.740181-62.646526-84.302115 2.320242-10.054381 18.561934 23.975831 75.021148 64.193354 35.577039 24.749245 103.637462 47.178248 126.839879 38.670695 84.302115-31.70997 105.18429-139.987915 114.465257-118.332326 24.749245 61.873112-62.646526 112.145015-72.700906 119.10574-8.507553 6.187311 37.123867 3.867069 106.731118-28.616314 23.975831-11.601208 105.957704-74.247734 92.036253-51.818732C728.942598 673.643505 599.782477 657.401813 581.993958 690.65861 548.73716 754.07855 628.398792 935.830816 622.984894 951.299094z" fill="url(#ct-trunk-g)" />

      {/* ===== Gold blossoms in the canopy ===== */}
      <g filter="url(#ct-glow)">
        <circle cx="420" cy="260" r="8" fill="url(#ct-gold)">
          <animate attributeName="opacity" values="1;0.5;1" dur="3.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="580" cy="220" r="9" fill="url(#ct-gold)">
          <animate attributeName="opacity" values="1;0.5;1" dur="2.7s" repeatCount="indefinite" />
        </circle>
        <circle cx="510" cy="170" r="7" fill="url(#ct-gold)">
          <animate attributeName="opacity" values="1;0.55;1" dur="3.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="620" cy="300" r="6" fill="url(#ct-gold)">
          <animate attributeName="opacity" values="1;0.5;1" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="380" cy="340" r="6" fill="url(#ct-gold)">
          <animate attributeName="opacity" values="1;0.5;1" dur="3.4s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* ===== Central crown blossom ===== */}
      <g filter="url(#ct-glow-soft)">
        <circle cx="518" cy="120" r="10" fill="url(#ct-gold)">
          <animate attributeName="opacity" values="1;0.55;1" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="r" values="10;13;10" dur="2.4s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* ===== Twinkling stars ===== */}
      <g filter="url(#ct-glow)">
        <circle cx="518" cy="60" r="5" fill="#EDE4FF" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="280" cy="200" r="4" fill="#C4B5FD" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="3.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="760" cy="200" r="4" fill="#DDD6FE" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="3.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="380" cy="100" r="3.5" fill="#E9D5FF" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.7s" repeatCount="indefinite" />
        </circle>
        <circle cx="650" cy="100" r="3.5" fill="#C4B5FD" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="340" cy="320" r="3" fill="#A78BFA" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.15;0.5" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="700" cy="320" r="3" fill="#C4B5FD" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.15;0.5" dur="3.8s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Apex diamond */}
      <g transform="translate(518,60)" filter="url(#ct-glow)">
        <path d="M0 -11 L3.2 0 L0 11 L-3.2 0Z" fill="#FBE6B0" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.35;0.9" dur="2.2s" repeatCount="indefinite" />
        </path>
      </g>
    </svg>
  );
}
