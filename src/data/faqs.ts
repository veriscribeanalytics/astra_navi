export interface FAQ {
    question: string;
    answer: string;
}

export const faqs: FAQ[] = [
    {
        question: "What is the difference between Vedic and Western astrology?",
        answer: "Vedic astrology (Jyotish) is an ancient Indian science based on the sidereal zodiac, focusing heavily on your Karma, planetary dashas (periods), and precise moon placements. Western astrology uses the tropical zodiac and is more heavily focused on psychological profiling based on the Sun sign."
    },
    {
        question: "How accurate is Navi AI compared to a human astrologer?",
        answer: "Navi AI is trained on thousands of ancient astrological texts, planetary ephemerides, and classical combinations (Yogas). While it provides mathematically flawless chart calculations and vast scriptural interpretations, we recommend using it as a powerful cosmic GPS rather than a replacement for human intuitive reading."
    },
    {
        question: "Is my birth data stored securely?",
        answer: "Absolutely. Your exact date, time, and location of birth are highly personal. AstraNavi encrypts this data end-to-end. If you are using the application without an account, nothing is stored beyond your current browser session."
    },
    {
        question: "Does AstraNavi generate a full Kundli report?",
        answer: "Yes. Once you enter your birth details, AstraNavi generates a complete birth chart (Kundli) covering all 12 houses, planetary degrees, D9 Navamsha chart, and current Mahadasha timeline."
    },
    {
        question: "Can I switch between Vedic and Western charts?",
        answer: "Yes, AstraNavi gives you the unique ability to toggle between traditional Vedic (North/South Indian style) and Western circular chart representations within your dashboard."
    }
];
