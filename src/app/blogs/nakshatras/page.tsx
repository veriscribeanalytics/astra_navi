'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
    Star, ArrowLeft, ChevronRight, Compass, Info, Scale, 
    Activity, Lock, Zap, Dna, Moon, Sparkles, Target, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

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
        <div className="min-h-screen bg-[var(--bg)] pt-20 pb-20 px-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] right-[5%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[10%] left-[5%] w-[35%] h-[35%] bg-secondary/3 blur-[100px] rounded-full"></div>
            </div>

            <div className="max-w-[1500px] mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <Link href="/blogs" className="inline-flex items-center gap-2 group">
                            <ArrowLeft className="w-4 h-4 text-secondary group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/60 group-hover:text-secondary transition-colors">Knowledge Center</span>
                        </Link>
                    </motion.div>
                    
                    <div className="text-right">
                        <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Lunar <span className="text-secondary italic">Mansions</span></h1>
                        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mt-1">Phase 3: The Subconscious Layer</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Navigation Sidebar */}
                    <div className="w-full lg:w-[240px] shrink-0 sticky lg:top-24 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="flex flex-col gap-2">
                            {nakshatras.map((nak) => (
                                <button
                                    key={nak.id}
                                    onClick={() => setSelectedNakshatra(nak)}
                                    className={`relative p-3 rounded-[20px] transition-all duration-300 flex items-center gap-3 group border ${
                                        selectedNakshatra.id === nak.id 
                                        ? 'bg-secondary text-white shadow-lg border-secondary' 
                                        : 'bg-surface/40 hover:bg-surface/80 text-foreground/60 border-outline-variant/10'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${selectedNakshatra.id === nak.id ? 'bg-white/20 text-white' : 'bg-secondary/10 text-secondary'}`}>
                                        {nak.id}
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-[13px] font-bold font-headline">{nak.nameEn}</p>
                                        <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${selectedNakshatra.id === nak.id ? 'text-white/60' : 'text-foreground/30'}`}>
                                            {nak.nameHi}
                                        </p>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedNakshatra.id === nak.id ? 'translate-x-1' : 'opacity-0'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Detail View */}
                    <div className="flex-1 w-full min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedNakshatra.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                            >
                                <Card padding="none" className="!rounded-[32px] border border-outline-variant/30 bg-surface overflow-hidden">
                                    <div className="p-8 sm:p-12">
                                        <div className="flex flex-col md:flex-row items-center gap-10 mb-10 pb-10 border-b border-outline-variant/10">
                                            <div className="relative">
                                                <div className="absolute inset-[-20px] bg-secondary/10 blur-[40px] rounded-full opacity-60"></div>
                                                <div className="w-40 h-40 rounded-[48px] bg-surface border border-secondary/20 flex items-center justify-center text-secondary relative z-10 shadow-xl overflow-hidden group">
                                                    <Star className="w-20 h-20 transition-transform duration-700 group-hover:scale-110" />
                                                    <div className="absolute bottom-0 left-0 right-0 bg-secondary/10 py-1 text-[10px] font-bold text-center uppercase tracking-widest">{selectedNakshatra.id} / 27</div>
                                                </div>
                                            </div>

                                            <div className="flex-1 text-center md:text-left">
                                                <div className="flex flex-wrap items-baseline justify-center md:justify-start gap-4 mb-4">
                                                    <h2 className="text-6xl font-headline font-bold text-foreground">{selectedNakshatra.nameEn}</h2>
                                                    <span className="text-3xl text-secondary font-headline italic">— {selectedNakshatra.nameHi}</span>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Lord</p>
                                                        <p className="text-base font-bold text-secondary">{selectedNakshatra.ruler}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Symbol</p>
                                                        <p className="text-base font-bold text-foreground/80">{selectedNakshatra.symbol}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Gana</p>
                                                        <p className="text-base font-bold text-foreground/80">{selectedNakshatra.gana}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Animal (Yoni)</p>
                                                        <p className="text-base font-bold text-secondary">{selectedNakshatra.yoni}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-12">
                                            <div className="space-y-8">
                                                <div>
                                                    <h3 className="text-[11px] font-bold text-secondary uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                                        <Dna className="w-4 h-4" />
                                                        Karmic Deep Dive
                                                    </h3>
                                                    <p className="text-lg text-foreground/90 leading-relaxed font-light italic border-l-2 border-secondary/20 pl-6">
                                                        &quot;{selectedNakshatra.deepDive}&quot;
                                                    </p>
                                                </div>

                                                <div className="p-6 rounded-2xl bg-surface/40 border border-outline-variant/10">
                                                    <h4 className="text-[10px] font-bold text-foreground/50 mb-3 uppercase tracking-widest">Fundamental Trait</h4>
                                                    <p className="text-[15px] text-foreground font-medium leading-relaxed">
                                                        {selectedNakshatra.trait}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="space-y-4">
                                                    <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/10 flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <Zap className="w-5 h-5 text-secondary/40 group-hover:text-secondary transition-colors" />
                                                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Nakshatra Shakti</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-foreground">{selectedNakshatra.shakti}</span>
                                                    </div>
                                                    <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/10 flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <Activity className="w-5 h-5 text-secondary/40 group-hover:text-secondary transition-colors" />
                                                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Nadi (Ayurvedic Flow)</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-foreground">{selectedNakshatra.nadi}</span>
                                                    </div>
                                                    <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/10 flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <Compass className="w-5 h-5 text-secondary/40 group-hover:text-secondary transition-colors" />
                                                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Purushartha (Goal)</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-foreground">{selectedNakshatra.element}</span>
                                                    </div>
                                                </div>

                                                <div className="p-6 rounded-3xl bg-surface border border-outline-variant/10 flex flex-col gap-4">
                                                    <div className="flex items-center gap-3">
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

                                        <div className="mt-12 pt-8 border-t border-outline-variant/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                                                    <Target className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-headline font-bold text-foreground">Find My Janma Nakshatra</h3>
                                                    <p className="text-[10px] text-foreground/40 tracking-wider uppercase font-bold">Discover your core subconscious blueprint</p>
                                                </div>
                                            </div>
                                            <Button onClick={() => router.push('/chat')} variant="secondary" className="!px-8 !py-3 !rounded-2xl !font-bold">Analyze Chart ✦</Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
