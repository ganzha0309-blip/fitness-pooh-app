import type { Challenge, Leaderboard, Profile, ProgressData, Training } from '../types';

export const API_URL = 'https://fitness-pooh-api.onrender.com';

type ApiProfileResult = {
  ok: boolean;
  profile: Profile;
  detail?: string;
};

type HabitMarkResult = {
  ok: boolean;
  message?: string;
  new_xp?: number;
  new_streak?: number;
  xp?: number;
  streak?: number;
  level?: string;
  habits?: Record<string, number>;
  habit_items?: Profile['habit_items'];
};

type ProgressResult = ProgressData & {
  ok?: boolean;
  detail?: string;
};

type ChallengesResult = {
  ok?: boolean;
  detail?: string;
  challenges?: Challenge[];
};

async function postJson<T>(path: string, body: unknown): Promise<{ response: Response; data: T }> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as T;
  return { response, data };
}

export async function fetchProfile(initData: string) {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    });
  } catch {
    throw new Error(`API недоступен: ${API_URL}`);
  }

  if (!response.ok) {
    let detail = '';
    try {
      const data = await response.json();
      detail = data.detail ? ` ${data.detail}` : '';
    } catch {
      detail = '';
    }
    throw new Error(`Не удалось загрузить профиль. HTTP ${response.status}.${detail}`);
  }

  return (await response.json()) as Profile;
}

export async function fetchTrainings() {
  const response = await fetch(`${API_URL}/trainings`);
  if (!response.ok) {
    throw new Error('Не удалось загрузить тренировки.');
  }
  return (await response.json()) as Training[];
}

export async function markHabit(initData: string, habit: string) {
  const { data } = await postJson<HabitMarkResult>('/habit', { initData, habit });
  return data;
}

export async function editHabit(
  initData: string,
  payload: { code: string; title: string; icon: string; caption: string },
) {
  const { response, data } = await postJson<ApiProfileResult>('/habit/edit', { initData, ...payload });
  if (!response.ok || !data.ok) {
    throw new Error(data.detail || 'Не удалось сохранить привычку.');
  }
  return data.profile;
}

export async function addHabit(
  initData: string,
  payload: { title: string; icon: string; caption: string },
) {
  const { response, data } = await postJson<ApiProfileResult>('/habit/add', { initData, ...payload });
  if (!response.ok || !data.ok) {
    throw new Error(data.detail || 'Лимит привычек для подписки достигнут.');
  }
  return data.profile;
}

export async function deleteHabit(initData: string, code: string) {
  const { response, data } = await postJson<ApiProfileResult>('/habit/delete', { initData, code });
  if (!response.ok || !data.ok) {
    throw new Error(data.detail || 'Не удалось удалить привычку.');
  }
  return data.profile;
}

export async function fetchLeaderboard() {
  const response = await fetch(`${API_URL}/leaderboard`);
  if (!response.ok) {
    throw new Error('Не удалось загрузить топ.');
  }
  return (await response.json()) as Leaderboard;
}

export async function fetchProgress(initData: string) {
  const { response, data } = await postJson<ProgressData>('/progress', { initData });
  if (!response.ok) {
    throw new Error('Не удалось загрузить прогресс.');
  }
  return data;
}

export async function addProgress(initData: string, body: Record<string, unknown>) {
  const { response, data } = await postJson<ProgressResult>('/progress/add', { initData, ...body });
  if (!response.ok || !data.ok) {
    throw new Error(data.detail || 'Не удалось сохранить замер.');
  }
  return { entries: data.entries, latest: data.latest, changes: data.changes };
}

export async function deleteProgress(initData: string, entryId: string) {
  const { response, data } = await postJson<ProgressResult>('/progress/delete', { initData, entry_id: entryId });
  if (!response.ok || !data.ok) {
    throw new Error(data.detail || 'Не удалось удалить замер.');
  }
  return { entries: data.entries, latest: data.latest, changes: data.changes };
}

export async function fetchChallenges(initData: string) {
  const { response, data } = await postJson<ChallengesResult>('/challenges', { initData });
  if (!response.ok) {
    throw new Error('Не удалось загрузить челленджи.');
  }
  return data.challenges || [];
}

export async function updateChallenge(initData: string, challengeId: string, action: 'join' | 'check') {
  const { response, data } = await postJson<ChallengesResult>(`/challenge/${action}`, {
    initData,
    challenge_id: challengeId,
  });
  if (!response.ok || !data.ok) {
    throw new Error(data.detail || 'Не удалось обновить челлендж.');
  }
  return data.challenges || [];
}
