import Image from "next/image";
import { PLANET_COLORS, PLANET_GLYPHS, PLANET_TO_ICON, normalizePlanetName } from "@/lib/astrology";

interface PlanetIconProps {
    planet: string;
    size?: string;
    imageSize?: number;
    className?: string;
}

export default function PlanetIcon({ planet, size = "w-12 h-12", imageSize = 64, className = "" }: PlanetIconProps) {
    const key = normalizePlanetName(planet);
    return (
        <div className={`${size} relative flex items-center justify-center shrink-0 ${className}`}>
            <div className="absolute inset-[-6px] blur-[28px] opacity-35 rounded-full" style={{ backgroundColor: PLANET_COLORS[key] || '#c8880a' }} />
            {PLANET_TO_ICON[key] ? (
                <Image src={PLANET_TO_ICON[key]} alt={planet} width={imageSize} height={imageSize} className="w-full h-full object-contain relative z-10 drop-shadow-xl" />
            ) : (
                <span className="text-4xl drop-shadow-lg relative z-10" style={{ color: PLANET_COLORS[key] }}>{PLANET_GLYPHS[key] || planet}</span>
            )}
        </div>
    );
}
