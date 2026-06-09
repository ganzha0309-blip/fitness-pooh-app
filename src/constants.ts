import type { HabitItem, ProgressMetric, Tab, Training } from './types';

export const progressMetrics: { key: ProgressMetric; label: string; unit: string }[] = [
  { key: 'weight', label: 'Вес', unit: 'кг' },
  { key: 'waist', label: 'Талия', unit: 'см' },
  { key: 'chest', label: 'Грудь', unit: 'см' },
  { key: 'arm', label: 'Рука', unit: 'см' },
  { key: 'thigh', label: 'Бедро', unit: 'см' },
];

export const defaultHabits: HabitItem[] = [
  { code: 'water', icon: '💧', title: 'Вода', caption: '2 литра за день', is_default: true },
  { code: 'workout', icon: '🏋️', title: 'Тренировка', caption: 'Любая активность', is_default: true },
  { code: 'sleep', icon: '😴', title: 'Сон', caption: '7-8 часов', is_default: true },
];

export const subscriptionRank: Record<string, number> = {
  free: 0,
  base: 1,
  pro: 2,
  vip: 3,
};

export const subscriptionLabels: Record<string, string> = {
  free: 'Free',
  base: 'Base',
  pro: 'PRO',
  vip: 'VIP',
};

export const tabLabels: Record<Tab, string> = {
  profile: 'Профиль',
  progress: 'Прогресс',
  challenges: 'Челленджи',
  trainings: 'Тренировки',
};

export const navigationItems: { tab: Tab; icon: string; label: string; caption: string }[] = [
  { tab: 'profile', icon: '👤', label: 'Профиль', caption: 'XP, уровень и привычки' },
  { tab: 'progress', icon: '📈', label: 'Прогресс', caption: 'Замеры и аналитика' },
  { tab: 'challenges', icon: '🏁', label: 'Челленджи', caption: 'Испытания и награды' },
  { tab: 'trainings', icon: '🏋️', label: 'Тренировки', caption: 'Планы и упражнения' },
];

export const fallbackTrainings: Training[] = [
  {
    id: 'morning',
    title: 'Утренняя зарядка',
    description: 'Легкий старт дня, мобилизация суставов и дыхание.',
    subscription: 'free',
    category: 'Дом',
    duration: '10 мин',
  },
  {
    id: 'back',
    title: 'Разминка для спины',
    description: 'Подходит после сидячего дня и перед основной тренировкой.',
    subscription: 'free',
    category: 'Мобилити',
    duration: '12 мин',
  },
  {
    id: 'mass-a',
    title: 'Массонабор: тренировка А',
    description: 'База для прогресса в силе и объеме.',
    subscription: 'pro',
    category: 'Зал',
    duration: '55 мин',
  },
];

export function todayIso() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeSubscription(value?: string) {
  const lower = (value || 'free').toLowerCase();
  return subscriptionRank[lower] === undefined ? 'free' : lower;
}

export function canOpen(userSubscription: string, requiredSubscription: string) {
  return subscriptionRank[normalizeSubscription(userSubscription)] >= subscriptionRank[normalizeSubscription(requiredSubscription)];
}

export function nextLevelXp(xp: number) {
  return Math.max(Math.ceil((xp + 1) / 100) * 100, 100);
}
