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
