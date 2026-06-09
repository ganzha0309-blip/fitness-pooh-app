export type Tab = 'profile' | 'progress' | 'challenges' | 'trainings';

export type Subscription = 'free' | 'base' | 'pro' | 'vip';

export type HabitItem = {
  code: string;
  icon: string;
  title: string;
  caption?: string;
  is_default?: boolean;
};

export type Profile = {
  name: string;
  username?: string | null;
  xp: number;
  streak: number;
  subscription: Subscription | string;
  subscription_until?: string | null;
  last_action_date?: string | null;
  level: string;
  habits?: Record<string, number>;
  habit_items?: HabitItem[];
  custom_habit_limit?: number;
  custom_habit_count?: number;
};

export type Training = {
  id: string | number;
  name?: string;
  title?: string;
  description?: string;
  level?: Subscription | string;
  subscription?: Subscription | string;
  category?: string;
  duration?: string;
};

export type LeaderboardUser = {
  place: number;
  name: string;
  username?: string | null;
  xp: number;
  streak: number;
  level: string;
};

export type LevelInfo = {
  xp: number;
  title: string;
};

export type Leaderboard = {
  top: LeaderboardUser[];
  levels: LevelInfo[];
};

export type ProgressMetric = 'weight' | 'waist' | 'chest' | 'arm' | 'thigh';

export type ProgressEntry = {
  id: string;
  date: string;
  created_at?: string;
  weight?: number | null;
  waist?: number | null;
  chest?: number | null;
  arm?: number | null;
  thigh?: number | null;
  note?: string;
};

export type ProgressData = {
  entries: ProgressEntry[];
  latest?: ProgressEntry | null;
  changes?: Record<string, number>;
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  reward_xp: number;
  required_subscription: Subscription | string;
  participants_count: number;
  available: boolean;
  joined: boolean;
  participant_status: string;
  progress_days: number;
  done_today: boolean;
};

export type ProgressForm = {
  weight: string;
  waist: string;
  chest: string;
  arm: string;
  thigh: string;
  note: string;
};
