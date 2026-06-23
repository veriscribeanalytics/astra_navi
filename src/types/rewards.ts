export interface DailyRewardCycleSlot {
  day: number;
  credits: number;
  isToday: boolean;
}

export interface DailyRewardStatus {
  currentStreak: number;
  longestStreak: number;
  totalClaims: number;
  claimableToday: boolean;
  lastClaimDate: string | null;
  nextRewardCredits: number;
  cycle: DailyRewardCycleSlot[];
}

export interface DailyRewardClaimResult {
  claimed: boolean;
  reason?: string;
  currentStreak: number;
  longestStreak: number;
  creditsAwarded: number;
  dayInCycle: number;
  nextRewardCredits: number;
  balanceAfter?: number;
}
