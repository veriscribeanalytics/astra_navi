// Utility to calculate age from date of birth
export const calculateAge = (dob: string | undefined): number | null => {
  if (!dob) return null;
  
  try {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch {
    return null;
  }
};

// Age bracket type
export type AgeBracket = '18-25' | '26-35' | '36-50' | '51+' | 'default';

// Get age bracket from age
export const getAgeBracket = (age: number | null): AgeBracket => {
  if (!age) return 'default';
  if (age >= 18 && age <= 25) return '18-25';
  if (age >= 26 && age <= 35) return '26-35';
  if (age >= 36 && age <= 50) return '36-50';
  if (age >= 51) return '51+';
  return 'default';
};

// Personalized questions based on age bracket
export const getPersonalizedQuestions = (ageBracket: AgeBracket): string[] => {
  const questionsByAge: Record<AgeBracket, string[]> = {
    '18-25': [
      "What career path aligns best with my birth chart?",
      "When is the right time for me to pursue higher education?",
      "What does my chart say about finding my life partner?",
    ],
    '26-35': [
      "When will I see a breakthrough in my career or financial growth?",
      "What does my birth chart reveal about my future life partner?",
      "Is this the right time to start a business or change careers?",
    ],
    '36-50': [
      "How can I maximize wealth and stability in my current Mahadasha?",
      "What does my chart say about my children's future?",
      "When is the best time for major investments or property purchase?",
    ],
    '51+': [
      "What spiritual practices align with my birth chart?",
      "How can I ensure health and longevity based on my chart?",
      "What legacy and wisdom should I focus on in this phase?",
    ],
    'default': [
      "When will I see a breakthrough in my career or financial growth?",
      "What does my birth chart reveal about my future life partner?",
      "Which planetary Mahadasha am I currently in and what are its effects?",
    ],
  };

  return questionsByAge[ageBracket];
};

// Get starter cards for dashboard (when no chats exist)
export const getStarterCards = (ageBracket: AgeBracket): Array<{title: string; description: string; question: string}> => {
  const cardsByAge: Record<AgeBracket, Array<{title: string; description: string; question: string}>> = {
    '18-25': [
      {
        title: "Career Direction",
        description: "Discover your ideal career path.",
        question: "What career path aligns best with my birth chart and natural talents?"
      },
      {
        title: "Education & Growth",
        description: "Timing for higher studies.",
        question: "When is the right time for me to pursue higher education or skill development?"
      },
    ],
    '26-35': [
      {
        title: "Wealth Synthesis",
        description: "Analyze your Artha house & career.",
        question: "Analyze my Career and Wealth potential based on my birth chart."
      },
      {
        title: "Relationship Path",
        description: "Understand your 7th house alignment.",
        question: "What does my Kundli say about my Love life and future partner?"
      },
    ],
    '36-50': [
      {
        title: "Wealth Maximization",
        description: "Optimize financial growth.",
        question: "How can I maximize wealth and stability in my current Mahadasha?"
      },
      {
        title: "Family & Legacy",
        description: "Children and family insights.",
        question: "What does my chart say about my children's future and family harmony?"
      },
    ],
    '51+': [
      {
        title: "Spiritual Path",
        description: "Align with your dharma.",
        question: "What spiritual practices align with my birth chart for inner peace?"
      },
      {
        title: "Health & Longevity",
        description: "Wellness guidance.",
        question: "How can I ensure health and longevity based on my planetary positions?"
      },
    ],
    'default': [
      {
        title: "Wealth Synthesis",
        description: "Analyze your Artha house & career.",
        question: "Analyze my Career and Wealth potential based on my birth chart."
      },
      {
        title: "Relationship Path",
        description: "Understand your 7th house alignment.",
        question: "What does my Kundli say about my Love life and future partner?"
      },
    ],
  };

  return cardsByAge[ageBracket];
};

export const getAvatarQuestions = (avatarId: string, ageBracket: AgeBracket): string[] => {
  const avatarQuestionsMap: Record<string, string[]> = {
    navi: [
      "What does today's planetary alignment mean for me?",
      "Which area of my life should I focus on this month?",
      "What is my current life lesson?",
      "Tell me about my dominant planetary energies."
    ],
    career_mentor: [
      "What career path aligns with my chart?",
      "When is a good time to ask for a promotion?",
      "Will I find success in my current field?",
      "What are my hidden professional strengths?"
    ],
    relationship_guide: [
      "When will I meet my life partner?",
      "Is my current relationship compatible?",
      "What patterns keep showing up in my relationships?",
      "How can I deepen my emotional connections?"
    ],
    spiritual_guide: [
      "What is my soul's purpose in this life?",
      "Which spiritual practices suit my nature?",
      "How can I find inner peace right now?",
      "What past-life karma am I working through?"
    ],
    astro_sage: [
      "Explain my Mahadasha and what it means.",
      "What does my Lagna reveal about me?",
      "Walk me through my key planetary aspects.",
      "Which yogas are present in my chart?"
    ]
  };

  return avatarQuestionsMap[avatarId] || avatarQuestionsMap.navi;
};

export type StarterIconKey = 'sun' | 'briefcase' | 'orbit' | 'heart' | 'compass' | 'sparkles' | 'star' | 'gem';

export interface StarterCard {
  title: string;
  description: string;
  question: string;
  icon: StarterIconKey;
}

export const getAvatarStarterCards = (avatarId: string): StarterCard[] => {
  const cardsByAvatar: Record<string, StarterCard[]> = {
    navi: [
      {
        title: "Today's Energy",
        description: "What does today's planetary alignment mean for me?",
        question: "What does today's planetary alignment mean for me?",
        icon: 'sun',
      },
      {
        title: 'Career Timing',
        description: 'Which area of work should I focus on this month?',
        question: 'Which area of work should I focus on this month?',
        icon: 'briefcase',
      },
      {
        title: 'Life Lesson',
        description: 'What is my current life lesson or soul growth?',
        question: 'What is my current life lesson?',
        icon: 'orbit',
      },
      {
        title: 'Relationships',
        description: 'What should I understand about love right now?',
        question: 'What should I understand about love right now?',
        icon: 'heart',
      },
    ],
    career_mentor: [
      {
        title: 'Career Path',
        description: 'Which direction best aligns with my chart?',
        question: 'What career path aligns with my chart?',
        icon: 'compass',
      },
      {
        title: 'Promotion Timing',
        description: 'When is a good time to make my move?',
        question: 'When is a good time to ask for a promotion?',
        icon: 'briefcase',
      },
      {
        title: 'Hidden Strengths',
        description: 'What professional gifts am I overlooking?',
        question: 'What are my hidden professional strengths?',
        icon: 'star',
      },
      {
        title: 'Success Outlook',
        description: 'Will I find success in my current field?',
        question: 'Will I find success in my current field?',
        icon: 'gem',
      },
    ],
    relationship_guide: [
      {
        title: 'Meeting My Partner',
        description: 'When will the right person enter my life?',
        question: 'When will I meet my life partner?',
        icon: 'heart',
      },
      {
        title: 'Compatibility',
        description: 'Is my current relationship aligned with my chart?',
        question: 'Is my current relationship compatible?',
        icon: 'sparkles',
      },
      {
        title: 'Recurring Patterns',
        description: 'What keeps repeating in my relationships?',
        question: 'What patterns keep showing up in my relationships?',
        icon: 'orbit',
      },
      {
        title: 'Deeper Connection',
        description: 'How can I deepen my emotional bonds?',
        question: 'How can I deepen my emotional connections?',
        icon: 'star',
      },
    ],
    spiritual_guide: [
      {
        title: "Soul's Purpose",
        description: 'What is my reason for being here?',
        question: "What is my soul's purpose in this life?",
        icon: 'sparkles',
      },
      {
        title: 'Spiritual Practice',
        description: 'Which practices fit my nature?',
        question: 'Which spiritual practices suit my nature?',
        icon: 'gem',
      },
      {
        title: 'Inner Peace',
        description: 'How can I find calm right now?',
        question: 'How can I find inner peace right now?',
        icon: 'compass',
      },
      {
        title: 'Past-Life Karma',
        description: 'What am I here to resolve?',
        question: 'What past-life karma am I working through?',
        icon: 'orbit',
      },
    ],
    astro_sage: [
      {
        title: 'Mahadasha',
        description: 'What planetary period am I in?',
        question: 'Explain my Mahadasha and what it means.',
        icon: 'orbit',
      },
      {
        title: 'My Lagna',
        description: 'What does my Ascendant reveal?',
        question: 'What does my Lagna reveal about me?',
        icon: 'sun',
      },
      {
        title: 'Planetary Aspects',
        description: 'Walk me through my key aspects.',
        question: 'Walk me through my key planetary aspects.',
        icon: 'star',
      },
      {
        title: 'Yogas in My Chart',
        description: 'Which yogas shape my life?',
        question: 'Which yogas are present in my chart?',
        icon: 'gem',
      },
    ],
  };

  return cardsByAvatar[avatarId] || cardsByAvatar.navi;
};
