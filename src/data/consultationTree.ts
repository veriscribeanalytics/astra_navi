// ============== TYPES ==============

export interface ConsultQuestion {
  text: string;
}

export interface SubCategory {
  key: string;
  label: string;
  questions: string[];
}

export interface Category {
  key: string;
  label: string;
  icon: string;
  subs: SubCategory[];
}

export interface AgeGroup {
  life_stage: string;
  primary: Category[];
  hidden: Category[];
}

export type ResponseTone = 'warm' | 'emotional' | 'realistic' | 'short' | 'detailed';

export interface ConsultPayload {
  birth_date: string;
  birth_time: string;
  birth_place: string;
  name: string;
  language: string;
  primary_category: string;
  secondary_category: string;
  final_question: string;
  response_tone: ResponseTone;
  optional_note?: string;
}

// ============== AGE CALCULATOR ==============

export function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function getAgeGroup(age: number): { key: string; label: string; lifeStage: string } {
  if (age <= 16) return { key: "13-16", label: "13–16", lifeStage: "Early Teens" };
  if (age <= 20) return { key: "17-20", label: "17–20", lifeStage: "Late Teens" };
  if (age <= 29) return { key: "21-29", label: "21–29", lifeStage: "Young Adult" };
  if (age <= 39) return { key: "30-39", label: "30–39", lifeStage: "Settling Phase" };
  if (age <= 49) return { key: "40-49", label: "40–49", lifeStage: "Mid-Life" };
  if (age <= 69) return { key: "50-69", label: "50–69", lifeStage: "Senior Phase" };
  return { key: "70+", label: "70+", lifeStage: "Elder Wisdom" };
}

export const TONE_OPTIONS: { key: ResponseTone; label: string; emoji: string }[] = [
  { key: 'warm', label: 'Warm', emoji: '☀️' },
  { key: 'emotional', label: 'Emotional', emoji: '💗' },
  { key: 'realistic', label: 'Realistic', emoji: '⚡' },
  { key: 'short', label: 'Short', emoji: '✂️' },
  { key: 'detailed', label: 'Detailed', emoji: '📖' },
];
