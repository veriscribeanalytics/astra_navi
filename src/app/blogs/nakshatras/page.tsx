'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
    Star, ArrowLeft, ChevronRight, Compass, Info, Scale, 
    Activity, Lock, Zap, Dna, Moon, Sparkles, Target, Shield,
    BookOpen, CheckCircle2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

import Image from 'next/image';

const nakshatras = [
    { 
        id: 1, nameEn: 'Ashwini', nameHi: 'अश्विनी', sanskrit: 'Ashwayuja', ruler: 'Ketu', deity: 'Ashwini Kumaras', 
        symbol: 'Horse Head', yoni: 'Horse (Male)', gana: 'Deva', element: 'Dharma', padas: 'Chu, Che, Cho, La', 
        shakti: 'Shidravyapani (Quick Reach)', nadi: 'Adi (Vata)', 
        pada_logic: 'Pada 1: Aries/Soul, Pada 2: Taurus/Resources, Pada 3: Gemini/Mind, Pada 4: Cancer/Emotion',
        trait: 'Quick, energetic, healing-oriented, adventurous.', 
        deepDive: 'The first Nakshatra of the zodiac, Ashwini represents the power of initiation and rapid action. It is ruled by the twin physicians of the Gods, bestowing great healing abilities and a youthful spirit.' 
    },
    { 
        id: 2, nameEn: 'Bharani', nameHi: 'भरणी', sanskrit: 'Apabharani', ruler: 'Venus', deity: 'Yama', 
        symbol: 'Yoni / Triangle', yoni: 'Elephant (Male)', gana: 'Manushya', element: 'Artha', padas: 'Li, Lu, Le, Lo', 
        shakti: 'Apabharani (Taking Away)', nadi: 'Madhya (Pitta)',
        pada_logic: 'Pada 1: Leo/Will, Pada 2: Virgo/Service, Pada 3: Libra/Desire, Pada 4: Scorpio/Transformation',
        trait: 'Intense, creative, transformative, disciplined.', 
        deepDive: 'Bharani is the Nakshatra of "bearing" or carrying. It is associated with birth and death, ruled by Yama. It represents the struggle and effort required to bring something new into the world.' 
    },
    { 
        id: 3, nameEn: 'Krittika', nameHi: 'कृत्तिका', sanskrit: 'Agneya', ruler: 'Sun', deity: 'Agni', 
        symbol: 'Razor / Knife', yoni: 'Sheep (Female)', gana: 'Rakshasa', element: 'Kama', padas: 'A, I, U, E', 
        shakti: 'Dahana (Power to Burn)', nadi: 'Antya (Kapha)',
        pada_logic: 'Pada 1: Sagittarius/Wisdom, Pada 2: Capricorn/Structure, Pada 3: Aquarius/Intellect, Pada 4: Pisces/Liberation',
        trait: 'Sharp, critical, purifying, determined.', 
        deepDive: 'Krittika is symbolized by a razor, representing the power to cut through illusions. Ruled by the Fire God Agni, it bestows a sharp intellect and a burning desire for truth and purification.' 
    },
    { 
        id: 4, nameEn: 'Rohini', nameHi: 'रोहिणी', sanskrit: 'Rohini', ruler: 'Moon', deity: 'Brahma', 
        symbol: 'Ox Cart / Chariot', yoni: 'Serpent (Male)', gana: 'Manushya', element: 'Moksha', padas: 'O, Va, Vi, Vu', 
        shakti: 'Rohana (Power of Growth)', nadi: 'Antya (Kapha)',
        pada_logic: 'Pada 1: Aries/Vitality, Pada 2: Taurus/Manifestation, Pada 3: Gemini/Skill, Pada 4: Cancer/Sensitivity',
        trait: 'Attractive, artistic, creative, stable.', 
        deepDive: 'Rohini is the "Red One," the favorite consort of the Moon. It represents growth, fertility, and the peak of material beauty. It is the house of creative manifestation and abundance.' 
    },
    { 
        id: 5, nameEn: 'Mrigashira', nameHi: 'मृगशिरा', sanskrit: 'Agrahayani', ruler: 'Mars', deity: 'Soma', 
        symbol: 'Deer Head', yoni: 'Serpent (Female)', gana: 'Deva', element: 'Moksha', padas: 'Ve, Vo, Ka, Ke', 
        shakti: 'Prinana (Satisfaction)', nadi: 'Madhya (Pitta)',
        pada_logic: 'Pada 1: Leo/Power, Pada 2: Virgo/Detail, Pada 3: Libra/Balance, Pada 4: Scorpio/Intuition',
        trait: 'Curious, exploratory, gentle, restless.', 
        deepDive: 'Symbolized by the deer, Mrigashira is the Nakshatra of the quest. It represents the search for the unknown and the constant movement of the mind towards higher knowledge or sensory experience.' 
    },
    { 
        id: 6, nameEn: 'Ardra', nameHi: 'आर्द्रा', sanskrit: 'Raudra', ruler: 'Rahu', deity: 'Rudra', 
        symbol: 'Teardrop / Diamond', yoni: 'Dog (Female)', gana: 'Manushya', element: 'Dharma', padas: 'Ku, Gha, Nga, Chha', 
        shakti: 'Yatna (Effort/Struggle)', nadi: 'Adi (Vata)',
        pada_logic: 'Pada 1: Sagittarius/Expansion, Pada 2: Capricorn/Foundation, Pada 3: Aquarius/Vision, Pada 4: Pisces/Surrender',
        trait: 'Intense, transformative, brilliant, emotional.', 
        deepDive: 'Ardra represents the storm followed by the rainbow. Ruled by Rudra (the Howler), it signifies profound emotional transformation and the clarity that comes after a period of intense mental distress.' 
    },
    { 
        id: 7, nameEn: 'Punarvasu', nameHi: 'पुनर्वसु', sanskrit: 'Aditya', ruler: 'Jupiter', deity: 'Aditi', 
        symbol: 'Bow & Quiver', yoni: 'Cat (Female)', gana: 'Deva', element: 'Artha', padas: 'Ke, Ko, Ha, Hi', 
        shakti: 'Vasutva (Substance)', nadi: 'Adi (Vata)',
        pada_logic: 'Pada 1: Aries/Energy, Pada 2: Taurus/Stability, Pada 3: Gemini/Communication, Pada 4: Cancer/Care',
        trait: 'Resilient, optimistic, philosophical, generous.', 
        deepDive: 'Punarvasu means "return of the Light." It is the Nakshatra of renewal and rehabilitation. It bestows the ability to bounce back from any setback with an even stronger spirit.' 
    },
    { 
        id: 8, nameEn: 'Pushya', nameHi: 'पुष्य', sanskrit: 'Tishya', ruler: 'Saturn', deity: 'Brihaspati', 
        symbol: 'Cow Udder / Flower', yoni: 'Sheep (Male)', gana: 'Deva', element: 'Dharma', padas: 'Hu, He, Ho, Da', 
        shakti: 'Brahmavarchasa (Spiritual Power)', nadi: 'Madhya (Pitta)',
        pada_logic: 'Pada 1: Leo/Governance, Pada 2: Virgo/Practice, Pada 3: Libra/Justice, Pada 4: Scorpio/Secret Wisdom',
        trait: 'Nurturing, responsible, auspicious, ethical.', 
        deepDive: 'Considered the most auspicious of all Nakshatras, Pushya represents the power to nourish and protect. It is the house of the cosmic priest, bestowing wisdom and a deep sense of duty.' 
    },
    { 
        id: 9, nameEn: 'Ashlesha', nameHi: 'अश्लेषा', sanskrit: 'Sarpa', ruler: 'Mercury', deity: 'Nagas', 
        symbol: 'Coiled Serpent', yoni: 'Cat (Male)', gana: 'Rakshasa', element: 'Dharma', padas: 'Di, Du, De, Do', 
        shakti: 'Vishasleshana (Poisoning/Embracing)', nadi: 'Antya (Kapha)',
        pada_logic: 'Pada 1: Sagittarius/Ideology, Pada 2: Capricorn/Execution, Pada 3: Aquarius/Network, Pada 4: Pisces/Subconscious',
        trait: 'Cunning, insightful, mystical, intense.', 
        deepDive: 'Ashlesha is the Nakshatra of the serpent energy (Kundalini). it provides deep psychological insight and the power to paralyze enemies. It is a house of profound transformation and mystical secrets.' 
    },
    { 
        id: 10, nameEn: 'Magha', nameHi: 'मघा', sanskrit: 'Pitrya', ruler: 'Ketu', deity: 'Pitris', 
        symbol: 'Royal Throne', yoni: 'Rat (Male)', gana: 'Rakshasa', element: 'Artha', padas: 'Ma, Mi, Mu, Me', 
        shakti: 'Tyagekshepana (Leaving the Body)', nadi: 'Antya (Kapha)',
        pada_logic: 'Pada 1: Aries/Ancestry, Pada 2: Taurus/Lineage Resources, Pada 3: Gemini/Oral History, Pada 4: Cancer/Ancestral Home',
        trait: 'Regal, traditional, ancestral, powerful.', 
        deepDive: 'Magha is the seat of the ancestors. It represents lineage, tradition, and royal authority. Those born under this Star often feel a deep connection to their past and a responsibility to lead.' 
    },
    { 
        id: 11, nameEn: 'Purva Phalguni', nameHi: 'पूर्वा फाल्गुनी', sanskrit: 'Bhagya', ruler: 'Venus', deity: 'Bhaga', 
        symbol: 'Bed / Hammock', yoni: 'Rat (Female)', gana: 'Manushya', element: 'Kama', padas: 'Mo, Ta, Ti, Tu', 
        shakti: 'Prajanana (Procreation)', nadi: 'Madhya (Pitta)',
        pada_logic: 'Pada 1: Leo/Self, Pada 2: Virgo/Duty, Pada 3: Libra/Partnership, Pada 4: Scorpio/Inheritance',
        trait: 'Social, relaxed, creative, pleasure-seeking.', 
        deepDive: 'Associated with relaxation and creative arts, Purva Phalguni represents the accumulation of karma from the past that manifests as worldly comfort and social ease.' 
    },
    { 
        id: 12, nameEn: 'Uttara Phalguni', nameHi: 'उत्तरा फाल्गुनी', sanskrit: 'Aryaman', ruler: 'Sun', deity: 'Aryaman', 
        symbol: 'Bed Legs / Cot', yoni: 'Cow (Male)', gana: 'Manushya', element: 'Moksha', padas: 'Te, To, Pa, Pi', 
        shakti: 'Chayani (Accumulation/Merit)', nadi: 'Adi (Vata)',
        pada_logic: 'Pada 1: Sagittarius/Values, Pada 2: Capricorn/Status, Pada 3: Aquarius/Community, Pada 4: Pisces/Release',
        trait: 'Helpful, reliable, kind, courageous.', 
        deepDive: 'The "Star of Patronage," Uttara Phalguni represents the duty to help others and sustain the social order through friendship and charity.' 
    },
    { 
        id: 13, nameEn: 'Hasta', nameHi: 'हस्त', sanskrit: 'Hasta', ruler: 'Moon', deity: 'Savitr', 
        symbol: 'Hand / Fist', yoni: 'Buffalo (Female)', gana: 'Deva', element: 'Moksha', padas: 'Pu, Sha, Na, Tha', 
        shakti: 'Hasta (Power to Manifest)', nadi: 'Antya (Kapha)',
        pada_logic: 'Pada 1: Aries/Action, Pada 2: Taurus/Skill, Pada 3: Gemini/Craft, Pada 4: Cancer/Nurturing',
        trait: 'Skillful, hard-working, clever, witty.', 
        deepDive: 'Hasta represents the power of the hand—craftsmanship, healing, and the ability to manifest material goals through persistent and skillful effort.' 
    },
    { 
        id: 14, nameEn: 'Chitra', nameHi: 'चित्रा', sanskrit: 'Chitra', ruler: 'Mars', deity: 'Tvashtr', 
        symbol: 'Pearl / Gem', yoni: 'Tiger (Female)', gana: 'Rakshasa', element: 'Dharma', padas: 'Pe, Po, Ra, Ri', 
        shakti: 'Punya (Power of Merit)', nadi: 'Madhya (Pitta)',
        pada_logic: 'Pada 1: Leo/Grandeur, Pada 2: Virgo/Excellence, Pada 3: Libra/Art, Pada 4: Scorpio/Depth',
        trait: 'Beautiful, artistic, creative, innovative.', 
        deepDive: 'The "Bright Star," Chitra is the Nakshatra of the cosmic architect. It bestows the power to create beautiful forms, whether in art, engineering, or social structures.' 
    },
    { 
        id: 15, nameEn: 'Swati', nameHi: 'स्वाती', sanskrit: 'Swati', ruler: 'Rahu', deity: 'Vayu', 
        symbol: 'Coral / Young Sprout', yoni: 'Buffalo (Male)', gana: 'Deva', element: 'Artha', padas: 'Ru, Re, Ro, Ta', 
        shakti: 'Pradhvamsana (Scattering Like Wind)', nadi: 'Antya (Kapha)',
        pada_logic: 'Pada 1: Sagittarius/Travel, Pada 2: Capricorn/Persistence, Pada 3: Aquarius/Vision, Pada 4: Pisces/Intuition',
        trait: 'Independent, flexible, social, diplomatic.', 
        deepDive: 'Symbolized by a young sprout blowing in the wind, Swati represents the power of movement and independence, governed by Vayu, the God of the Wind.' 
    },
    { 
        id: 16, nameEn: 'Vishakha', nameHi: 'विशाखा', sanskrit: 'Vishakha', ruler: 'Jupiter', deity: 'Indragni', 
        symbol: 'Archway / Triumphal Arch', yoni: 'Tiger (Male)', gana: 'Rakshasa', element: 'Dharma', padas: 'Ti, Tu, Te, To', 
        shakti: 'Vyapana (Pervasiveness)', nadi: 'Antya (Kapha)',
        pada_logic: 'Pada 1: Aries/Drive, Pada 2: Taurus/Acquisition, Pada 3: Gemini/Talk, Pada 4: Cancer/Belonging',
        trait: 'Ambitious, focused, determined, competitive.', 
        deepDive: 'The "Star of Purpose," Vishakha represents the duality of Indra and Agni. It provides the competitive edge and relentless focus needed to achieve long-term goals.' 
    },
    { 
        id: 17, nameEn: 'Anuradha', nameHi: 'अनुराधा', sanskrit: 'Anuradha', ruler: 'Saturn', deity: 'Mitra', 
        symbol: 'Lotus / Staff', yoni: 'Deer (Female)', gana: 'Deva', element: 'Dharma', padas: 'Na, Ni, Nu, Ne', 
        shakti: 'Radhana (Power to Worship)', nadi: 'Madhya (Pitta)',
        pada_logic: 'Pada 1: Leo/Command, Pada 2: Virgo/Analysis, Pada 3: Libra/Harmony, Pada 4: Scorpio/Intensity',
        trait: 'Loyal, friendly, devoted, successful.', 
        deepDive: 'Anuradha represents the power of friendship and cooperation. It is the "Star of Success" that arises through forming strong, loyal connections with others.' 
    },
    { 
        id: 18, nameEn: 'Jyeshtha', nameHi: 'ज्येष्ठा', sanskrit: 'Jyeshtha', ruler: 'Mercury', deity: 'Indra', 
        symbol: 'Umbrella / Circular Amulet', yoni: 'Deer (Male)', gana: 'Rakshasa', element: 'Artha', padas: 'No, Ya, Yi, Yu', 
        shakti: 'Arohana (Rising/Superiority)', nadi: 'Adi (Vata)',
        pada_logic: 'Pada 1: Sagittarius/Law, Pada 2: Capricorn/Responsibility, Pada 3: Aquarius/Innovation, Pada 4: Pisces/Sacrifice',
        trait: 'Protective, powerful, senior, independent.', 
        deepDive: 'Jyeshtha means "The Eldest." Ruled by Indra, it bestows the power to protect and lead. It represents the peak of material and mental power before spiritual transformation.' 
    },
    { 
        id: 19, nameEn: 'Mula', nameHi: 'मूल', sanskrit: 'Mula', ruler: 'Ketu', deity: 'Nirriti', 
        symbol: 'Bundle of Roots / Elephant Goad', yoni: 'Dog (Male)', gana: 'Rakshasa', element: 'Kama', padas: 'Ye, Yo, Ba, Bi', 
        shakti: 'Barhana (Power to Destroy/Uproot)', nadi: 'Adi (Vata)',
        pada_logic: 'Pada 1: Aries/Initiative, Pada 2: Taurus/Rooting, Pada 3: Gemini/Inquiry, Pada 4: Cancer/Feeling',
        trait: 'Rooted, investigative, transformative, intense.', 
        deepDive: 'The "Star of the Root," Mula represents the core. It has the power to destroy the old to make way for the new, making it a Star of deep spiritual transformation.' 
    },
    { 
        id: 20, nameEn: 'Purva Ashadha', nameHi: 'पूर्वाषाढ़ा', sanskrit: 'Purvashadha', ruler: 'Venus', deity: 'Apah', 
        symbol: 'Winnowing Basket / Fan', yoni: 'Monkey (Male)', gana: 'Manushya', element: 'Moksha', padas: 'Bu, Dha, Pha, Dha', 
        shakti: 'Varchasva (Invincibility/Shining)', nadi: 'Madhya (Pitta)',
        pada_logic: 'Pada 1: Leo/Confidence, Pada 2: Virgo/Care, Pada 3: Libra/Art, Pada 4: Scorpio/Magic',
        trait: 'Invincible, optimistic, artistic, flowing.', 
        deepDive: 'The "Undefeated Star," Purva Ashadha represents the power to remain undefeated in the face of challenges. Ruled by the Water Goddess Apah, it provides great resilience.' 
    },
    { 
        id: 21, nameEn: 'Uttara Ashadha', nameHi: 'उत्तराषाढ़ा', sanskrit: 'Uttarashadha', ruler: 'Sun', deity: 'Vishvadevas', 
        symbol: 'Elephant Tusk / Small Bed', yoni: 'Mongoose (Male)', gana: 'Manushya', element: 'Kama', padas: 'Be, Bo, Ja, Ji', 
        shakti: 'Apradhrisya (Unchallengeable Victory)', nadi: 'Antya (Kapha)',
        pada_logic: 'Pada 1: Sagittarius/Ethics, Pada 2: Capricorn/Status, Pada 3: Aquarius/Group, Pada 4: Pisces/Spirit',
        trait: 'Persistent, noble, victorious, responsible.', 
        deepDive: 'Uttara Ashadha represents final victory and the power to achieve permanent success through righteousness and persistence.' 
    },
    { 
        id: 22, nameEn: 'Shravana', nameHi: 'श्रवण', sanskrit: 'Shravana', ruler: 'Moon', deity: 'Vishnu', 
        symbol: 'Ear / Three Footprints', yoni: 'Monkey (Female)', gana: 'Deva', element: 'Artha', padas: 'Khi, Khu, Khe, Kho', 
        shakti: 'Aprati (Connecting/Success)', nadi: 'Antya (Kapha)',
        pada_logic: 'Pada 1: Aries/Action, Pada 2: Taurus/Wealth, Pada 3: Gemini/Speech, Pada 4: Cancer/Devotion',
        trait: 'Learned, good listener, organized, famous.', 
        deepDive: 'The "Star of Listening," Shravana represents the power to receive knowledge and wisdom through the ear. It is the Star of oral tradition and spiritual learning.' 
    },
    { 
        id: 23, nameEn: 'Dhanishta', nameHi: 'धनिष्ठा', sanskrit: 'Shravishtha', ruler: 'Mars', deity: 'Eight Vasus', 
        symbol: 'Drum / Flute', yoni: 'Lion (Female)', gana: 'Rakshasa', element: 'Dharma', padas: 'Ga, Gi, Gu, Ge', 
        shakti: 'Sampatti (Wealth/Abundance)', nadi: 'Madhya (Pitta)',
        pada_logic: 'Pada 1: Leo/Glory, Pada 2: Virgo/Skill, Pada 3: Libra/Music, Pada 4: Scorpio/Magic',
        trait: 'Wealthy, artistic, rhythmic, confident.', 
        deepDive: 'The "Star of Symphony," Dhanishta represents the power to gain wealth and abundance through rhythm and coordination with the cosmic forces.' 
    },
    { 
        id: 24, nameEn: 'Shatabhisha', nameHi: 'शतभिषा', sanskrit: 'Shatataraka', ruler: 'Rahu', deity: 'Varuna', 
        symbol: 'Empty Circle / 100 Flowers', yoni: 'Horse (Female)', gana: 'Rakshasa', element: 'Artha', padas: 'Go, Sa, Si, Su', 
        shakti: 'Bheshaja (Power to Heal/100 Physicians)', nadi: 'Adi (Vata)',
        pada_logic: 'Pada 1: Sagittarius/Knowledge, Pada 2: Capricorn/Silence, Pada 3: Aquarius/Innovation, Pada 4: Pisces/Mysticism',
        trait: 'Secretive, visionary, philosophical, healing.', 
        deepDive: 'The "Star of a Hundred Physicians," Shatabhisha represents the power to heal chronic or complex illnesses through unconventional and visionary methods.' 
    },
    { 
        id: 25, nameEn: 'Purva Bhadrapada', nameHi: 'पूर्वभाद्रपदा', sanskrit: 'Purvabhadra', ruler: 'Jupiter', deity: 'Aja Ekapada', 
        symbol: 'Two Legs of Cot / Sword', yoni: 'Lion (Male)', gana: 'Manushya', element: 'Artha', padas: 'Se, So, Da, Di', 
        shakti: 'Yajamana (Spiritual Fire)', nadi: 'Adi (Vata)',
        pada_logic: 'Pada 1: Aries/Will, Pada 2: Taurus/Values, Pada 3: Gemini/Dualism, Pada 4: Cancer/Feeling',
        trait: 'Intense, spiritual, passionate, independent.', 
        deepDive: 'Purva Bhadrapada represents the "burning" fire of transformation. It provides the passion and spiritual drive to transcend material limitations.' 
    },
    { 
        id: 26, nameEn: 'Uttara Bhadrapada', nameHi: 'उत्तरभाद्रपदा', sanskrit: 'Uttarabhadra', ruler: 'Saturn', deity: 'Ahir Budhanya', 
        symbol: 'Two Legs of Cot / Twins', yoni: 'Cow (Female)', gana: 'Manushya', element: 'Kama', padas: 'Du, Tha, Jha, Na', 
        shakti: 'Varshodyamana (Power of Rain/Growth)', nadi: 'Madhya (Pitta)',
        pada_logic: 'Pada 1: Leo/Stability, Pada 2: Virgo/Refinement, Pada 3: Libra/Relations, Pada 4: Scorpio/Occult',
        trait: 'Wise, self-controlled, patient, generous.', 
        deepDive: 'Uttara Bhadrapada represents the "Star of the Deep." It bestows wisdom, psychic power, and the ability to control the deep subconscious currents.' 
    },
    { 
        id: 27, nameEn: 'Revati', nameHi: 'रेवती', sanskrit: 'Revati', ruler: 'Mercury', deity: 'Pushan', 
        symbol: 'Fish / Drum', yoni: 'Elephant (Female)', gana: 'Deva', element: 'Moksha', padas: 'De, Do, Cha, Chi', 
        shakti: 'Kshirapani (Nourishment)', nadi: 'Antya (Kapha)',
        pada_logic: 'Pada 1: Sagittarius/Wisdom, Pada 2: Capricorn/Guidance, Pada 3: Aquarius/Network, Pada 4: Pisces/Liberation',
        trait: 'Wealthy, nourishing, kind, intuitive.', 
        deepDive: 'The final Nakshatra of the zodiac, Revati represents completion and guidance. Ruled by Pushan, the protector of travelers, it ensures a safe passage to the next life or state of consciousness.' 
    }
];

export default function NakshatrasPage() {
    const [selectedNakshatra, setSelectedNakshatra] = useState(nakshatras[0]);
    const router = useRouter();

    return (
        <div className="min-h-[calc(100dvh-var(--navbar-height,64px))] bg-[var(--bg)] px-2 sm:px-4 pb-4 safe-bottom-buffer relative overflow-hidden flex flex-col items-center">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] right-[5%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[10%] left-[5%] w-[35%] h-[35%] bg-secondary/3 blur-[100px] rounded-full"></div>
            </div>

            <div className="max-w-[1500px] w-full mx-auto relative z-10 flex flex-col lg:flex-row gap-5">
                {/* Master: Sidebar (Left) */}
                <div className="lg:w-[260px] lg:h-[calc(100vh-100px)] flex-shrink-0 flex flex-col">
                    <div className="mb-2 px-1">
                        <Link href="/blogs" className="inline-flex items-center gap-1.5 text-secondary hover:text-secondary/70 transition-all mb-1 group">
                            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Library</span>
                        </Link>
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                            Lunar <span className="text-secondary italic">Mansions</span>
                        </h1>
                    </div>

                    <div className="flex-grow overflow-y-auto scrollbar-hide pb-10">
                        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/30 px-2 mb-2">The 27 Nakshatras</div>
                        <div className="grid grid-cols-6 lg:grid-cols-2 gap-1.5 sm:gap-2">
                            {nakshatras.map((nak) => {
                                const isActive = selectedNakshatra.id === nak.id;
                                return (
                                    <button
                                        key={nak.id}
                                        onClick={() => setSelectedNakshatra(nak)}
                                        className={`group flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all duration-200 ${isActive
                                                ? 'border-secondary bg-secondary/5'
                                                : 'border-transparent hover:bg-surface'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all relative overflow-hidden ${isActive ? 'bg-secondary text-white' : 'bg-secondary/10 text-secondary group-hover:bg-secondary/20'}`}>
                                            <Image 
                                                src={`/icons/nakshatras/${nak.nameEn.toLowerCase()}.jpeg`}
                                                alt={nak.nameEn}
                                                fill
                                                className="object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.opacity = '0';
                                                }}
                                            />
                                            <span className="relative z-10">{nak.id}</span>
                                        </div>
                                        <p className={`text-[10px] font-bold mt-1.5 truncate w-full text-center ${isActive ? 'text-secondary' : 'text-foreground/50'}`}>
                                            {nak.nameEn}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Detail: Content (Right) */}
                <div className="flex-grow min-w-0 flex flex-col">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedNakshatra.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                                className="h-full flex flex-col items-start p-2 lg:pt-0"
                            >
                                <Card padding="none" className="w-full h-auto max-h-[90vh] !rounded-[40px] border-outline-variant/20 flex flex-col relative overflow-hidden bg-surface">
                                    <div className="absolute top-8 right-8 z-20">
                                        <button
                                            onClick={() => router.push('/kundli')}
                                            className="h-12 px-6 bg-gradient-to-r from-secondary to-secondary/80 text-background font-bold text-[11px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl flex items-center gap-3 shadow-xl shadow-secondary/20"
                                        >
                                            <Lock className="w-4 h-4 opacity-40" /> Analyze Nakshatra
                                        </button>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent pointer-events-none" />
                                    
                                    <div className="flex-grow p-8 lg:p-10 overflow-hidden flex flex-col">
                                        {/* ── Top Section: Massive Identity ── */}
                                        <div className="flex items-center gap-12 mb-8">
                                            <div className="w-[150px] h-[150px] bg-transparent rounded-[40px] flex items-center justify-center text-secondary relative z-10 shadow-sm group shrink-0 overflow-hidden">
                                                    <Image 
                                                        src={`/icons/nakshatras/${selectedNakshatra.nameEn.toLowerCase()}.jpeg`}
                                                        alt={selectedNakshatra.nameEn}
                                                        fill
                                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                    <div className="absolute bottom-0 left-0 right-0 bg-secondary/10 py-1 text-[9px] font-bold text-center uppercase tracking-widest z-20 backdrop-blur-sm">{selectedNakshatra.id} / 27</div>
                                            </div>
                                            <div className="flex-grow space-y-6">
                                                <div className="flex items-baseline gap-4">
                                                    <h2 className="text-6xl font-bold text-foreground tracking-tighter leading-none">{selectedNakshatra.nameEn}</h2>
                                                    <span className="text-3xl font-headline font-bold text-secondary italic opacity-80">— {selectedNakshatra.nameHi}</span>
                                                </div>
                                                
                                                {/* Top Metrics Grid */}
                                                <div className="grid grid-cols-4 gap-8 pt-2">
                                                    <div>
                                                        <span className="text-[10px] opacity-40 uppercase tracking-widest mb-1 block">Ruler (Lord)</span>
                                                        <p className="text-[14px] font-bold text-foreground/90">{selectedNakshatra.ruler}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] opacity-40 uppercase tracking-widest mb-1 block">Symbol</span>
                                                        <p className="text-[14px] font-bold text-foreground/90">{selectedNakshatra.symbol}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] opacity-40 uppercase tracking-widest mb-1 block">Gana</span>
                                                        <p className="text-[14px] font-bold text-foreground/90 uppercase">{selectedNakshatra.gana}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] opacity-40 uppercase tracking-widest mb-1 block">Animal (Yoni)</span>
                                                        <p className="text-[14px] font-bold text-secondary uppercase">{selectedNakshatra.yoni}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Middle Section: Bento Grid ── */}
                                        <div className="grid grid-cols-12 gap-8 flex-grow">
                                            {/* Left: Archetype & Signatures */}
                                            <div className="col-span-7 space-y-8">
                                                <div className="space-y-4">
                                                    <h3 className="text-[11px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                                                        <BookOpen className="w-4 h-4" /> Karmic Deep Dive
                                                    </h3>
                                                    <p className="text-[16px] font-light leading-relaxed text-foreground/80 italic border-l-2 border-secondary/20 pl-6 pr-6">
                                                        &quot;{selectedNakshatra.deepDive}&quot;
                                                    </p>
                                                </div>

                                                <div className="p-6 rounded-2xl bg-secondary/5 border border-secondary/5">
                                                    <h3 className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2 mb-2">
                                                        <Sparkles className="w-4 h-4" /> Fundamental Trait
                                                    </h3>
                                                    <p className="text-[14px] font-medium text-foreground/70 leading-relaxed">
                                                        {selectedNakshatra.trait}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right: Technical Stats Stack */}
                                            <div className="col-span-5 space-y-4">
                                                <div className="bg-secondary/5 rounded-[24px] p-5 border border-secondary/5">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between border-b border-outline-variant/5 pb-3">
                                                            <div className="flex items-center gap-2">
                                                                <Zap className="w-4 h-4 text-secondary/60" />
                                                                <span className="text-[9px] font-bold text-foreground/50 uppercase tracking-widest">Nakshatra Shakti</span>
                                                            </div>
                                                            <span className="text-sm font-bold text-foreground">{selectedNakshatra.shakti}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between border-b border-outline-variant/5 pb-3">
                                                            <div className="flex items-center gap-2">
                                                                <Activity className="w-4 h-4 text-secondary/60" />
                                                                <span className="text-[9px] font-bold text-foreground/50 uppercase tracking-widest">Nadi (Ayurvedic)</span>
                                                            </div>
                                                            <span className="text-sm font-bold text-foreground">{selectedNakshatra.nadi}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Compass className="w-4 h-4 text-secondary/60" />
                                                                <span className="text-[9px] font-bold text-foreground/50 uppercase tracking-widest">Purushartha</span>
                                                            </div>
                                                            <span className="text-sm font-bold text-foreground">{selectedNakshatra.element}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-6 rounded-3xl bg-surface border border-outline-variant/10 shadow-sm">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                                                            <Scale className="w-4 h-4 text-secondary" />
                                                        </div>
                                                        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Pada (D9) Logic</p>
                                                    </div>
                                                    <p className="text-[13px] text-foreground/70 leading-relaxed italic">
                                                        {selectedNakshatra.pada_logic}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Bottom Section: Action ── */}
                                        <div className="mt-8 pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                                                    <Target className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-foreground">Subconscious Blueprint</h3>
                                                    <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold">Discover your core Janma Nakshatra</p>
                                                </div>
                                            </div>
                                            <Button onClick={() => router.push('/chat')} variant="secondary" className="!px-6 !py-2.5 !rounded-xl !font-bold !text-[11px]">Analyze Chart ✦</Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
