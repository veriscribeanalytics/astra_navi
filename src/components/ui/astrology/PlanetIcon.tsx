import Image from "next/image";
import { PLANET_COLORS, PLANET_GLYPHS, PLANET_TO_ICON, normalizePlanetName } from "@/lib/astrology";

interface PlanetIconProps {
    planet: string;
    size?: string;
    imageSize?: number;
    className?: string;
    /** Stronger coloured glow — used when the planet is selected/focused. */
    glow?: boolean;
}

export default function PlanetIcon({ planet, size = "w-12 h-12", imageSize = 64, className = "", glow = false }: PlanetIconProps) {
    const key = normalizePlanetName(planet);
    const planetColor = PLANET_COLORS[key] || 'var(--secondary)';
    return (
        <div className={`${size} relative flex items-center justify-center shrink-0 ${className}`}>
            {glow ? (
                <div className="absolute inset-[-8px] blur-[30px] opacity-45 rounded-full" style={{ backgroundColor: planetColor }} />
            ) : (
                <div className="absolute inset-[-4px] blur-[18px] opacity-10 rounded-full bg-white" />
            )}
            {PLANET_TO_ICON[key] ? (
                <Image src={PLANET_TO_ICON[key]} alt={planet} width={imageSize} height={imageSize} className="w-full h-full object-contain relative z-10 drop-shadow-xl" />
            ) : (
                <div
                    className="w-full h-full rounded-full flex items-center justify-center relative z-10 border-2 shadow-inner"
                    style={{
                        backgroundColor: `${planetColor}15`,
                        borderColor: `${planetColor}60`,
                        boxShadow: `inset 0 0 20px ${planetColor}20`,
                    }}
                >
                    <span className="text-[26px] leading-none drop-shadow-lg" style={{ color: planetColor }}>
                        {PLANET_GLYPHS[key] || planet}
                    </span>
                </div>
            )}
        </div>
    );
}
