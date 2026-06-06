import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_URL = 'https://fitness-pooh-api.onrender.com';

type Tab = 'profile' | 'trainings';
type Subscription = 'free' | 'base' | 'pro' | 'vip';

type HabitItem = {
  code: string;
  icon: string;
  title: string;
  caption?: string;
  is_default?: boolean;
};

type Profile = {
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

type Training = {
  id: string | number;
  name?: string;
  title?: string;
  description?: string;
  level?: Subscription | string;
  subscription?: Subscription | string;
  category?: string;
  duration?: string;
};

const defaultHabits: HabitItem[] = [
  { code: 'water', icon: '💧', title: 'Вода', caption: '2 литра за день', is_default: true },
  { code: 'workout', icon: '🏋️', title: 'Тренировка', caption: 'Любая активность', is_default: true },
  { code: 'sleep', icon: '😴', title: 'Сон', caption: '7-8 часов', is_default: true },
];

const subscriptionRank: Record<string, number> = {
  free: 0,
  base: 1,
  pro: 2,
  vip: 3,
};

const subscriptionLabels: Record<string, string> = {
  free: 'Free',
  base: 'Base',
  pro: 'PRO',
  vip: 'VIP',
};

function todayIso() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeSubscription(value?: string) {
  const lower = (value || 'free').toLowerCase();
  return subscriptionRank[lower] === undefined ? 'free' : lower;
}

function canOpen(userSubscription: string, requiredSubscription: string) {
  return subscriptionRank[normalizeSubscription(userSubscription)] >= subscriptionRank[normalizeSubscription(requiredSubscription)];
}

function nextLevelXp(xp: number) {
  return Math.max(Math.ceil((xp + 1) / 100) * 100, 100);
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftIcon, setDraftIcon] = useState('✅');
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('✅');
  const [habitAction, setHabitAction] = useState<string | null>(null);

  const tg = (window as any).Telegram?.WebApp;
  const habitItems = profile?.habit_items?.length ? profile.habit_items : defaultHabits;
  const todayHabits = profile?.last_action_date === todayIso() ? profile?.habits || {} : {};
  const subscription = normalizeSubscription(profile?.subscription);
  const customHabitLimit = profile?.custom_habit_limit ?? 0;
  const customHabitCount = profile?.custom_habit_count ?? habitItems.filter((habit) => !habit.is_default).length;
  const canAddHabit = customHabitCount < customHabitLimit;
  const nextXp = nextLevelXp(profile?.xp || 0);
  const levelProgress = Math.min(100, Math.round(((profile?.xp || 0) % 100) || (profile?.xp ? 100 : 0)));

  const completedHabits = useMemo(
    () => habitItems.filter((habit) => todayHabits[habit.code]).length,
    [habitItems, todayHabits],
  );

  const loadProfile = async (initData: string) => {
    const response = await fetch(`${API_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    });

    if (!response.ok) {
      throw new Error('Не удалось загрузить профиль.');
    }

    const data = await response.json();
    setProfile(data);
    return data;
  };

  useEffect(() => {
    tg?.ready?.();
    tg?.expand?.();
  }, [tg]);

  useEffect(() => {
    const init = async () => {
      try {
        if (!tg) {
          setError('Открой приложение внутри Telegram.');
          return;
        }

        const initData = tg.initData;
        if (!initData) {
          setError('Telegram не передал данные авторизации.');
          return;
        }

        await loadProfile(initData);

        const trainingsResponse = await fetch(`${API_URL}/trainings`);
        if (trainingsResponse.ok) {
          setTrainings(await trainingsResponse.json());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка соединения.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [tg]);

  const handleHabit = async (habit: string) => {
    if (!profile || !tg?.initData) return;

    setMarking(habit);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/habit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData, habit }),
      });
      const result = await response.json();

      if (result.ok) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                xp: result.new_xp,
                streak: result.new_streak,
                level: result.level,
                last_action_date: todayIso(),
                habits: result.habits || { ...(prev.last_action_date === todayIso() ? prev.habits : {}), [habit]: 1 },
                habit_items: result.habit_items || prev.habit_items,
              }
            : prev,
        );
        setMessage(result.message || '+10 XP в копилку режима.');
      } else {
        await loadProfile(tg.initData);
        setMessage(result.message || 'Эта привычка уже отмечена сегодня.');
      }
    } catch {
      setMessage('Не удалось связаться с сервером.');
    } finally {
      setMarking(null);
    }
  };

  const saveHabitTitle = async (code: string) => {
    if (!tg?.initData || draftTitle.trim().length < 2) return;
    setHabitAction(code);
    try {
      const response = await fetch(`${API_URL}/habit/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData, code, title: draftTitle.trim(), icon: draftIcon.trim() || '✅' }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.detail || 'Не удалось сохранить привычку.');
      setProfile(result.profile);
      setEditingCode(null);
      setDraftTitle('');
      setDraftIcon('✅');
      setMessage('Привычка обновлена.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Не удалось сохранить привычку.');
    } finally {
      setHabitAction(null);
    }
  };

  const addHabit = async () => {
    if (!tg?.initData || newHabitTitle.trim().length < 2 || !canAddHabit) return;
    setHabitAction('add');
    try {
      const response = await fetch(`${API_URL}/habit/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData, title: newHabitTitle.trim(), icon: newHabitIcon.trim() || '✅' }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.detail || 'Лимит привычек для подписки достигнут.');
      setProfile(result.profile);
      setNewHabitTitle('');
      setNewHabitIcon('✅');
      setMessage('Привычка добавлена.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Не удалось добавить привычку.');
    } finally {
      setHabitAction(null);
    }
  };

  const deleteHabit = async (code: string) => {
    if (!tg?.initData) return;
    setHabitAction(code);
    try {
      const response = await fetch(`${API_URL}/habit/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData, code }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.detail || 'Не удалось удалить привычку.');
      setProfile(result.profile);
      setMessage('Привычка удалена.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Не удалось удалить привычку.');
    } finally {
      setHabitAction(null);
    }
  };

  if (loading) {
    return (
      <main className="app-shell center-state">
        <div className="loader" />
        <p>Загружаем Fitness Pooh...</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="app-shell center-state">
        <div className="error-mark">!</div>
        <h1>Не получилось открыть Mini App</h1>
        <p>{error || 'Профиль не найден.'}</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="top-panel">
        <div>
          <p className="eyebrow">Fitness Pooh</p>
          <h1>{activeTab === 'profile' ? 'Профиль' : 'Тренировки'}</h1>
        </div>
        <div className="avatar">{profile.name?.slice(0, 1) || 'P'}</div>
      </section>

      {activeTab === 'profile' && (
        <section className="screen">
          <div className="profile-hero">
            <div>
              <p className="muted">Привет,</p>
              <h2>{profile.name}</h2>
              {profile.username && <p className="muted">@{profile.username}</p>}
            </div>
            <span className="subscription-pill">{subscriptionLabels[subscription]}</span>
          </div>

          <div className="stats-grid">
            <article>
              <span>XP</span>
              <strong>{profile.xp}</strong>
            </article>
            <article>
              <span>Streak</span>
              <strong>{profile.streak} дн.</strong>
            </article>
            <article>
              <span>Сегодня</span>
              <strong>
                {completedHabits}/{habitItems.length}
              </strong>
            </article>
          </div>

          <section className="level-card">
            <div className="level-row">
              <div>
                <span>Уровень</span>
                <strong>{profile.level}</strong>
              </div>
              <span>{nextXp - profile.xp} XP до цели</span>
            </div>
            <div className="progress-track">
              <div style={{ width: `${levelProgress}%` }} />
            </div>
          </section>

          <section className="habit-list">
            <div className="section-title">
              <h3>Привычки дня</h3>
              <button className="ghost-button" onClick={() => setSettingsOpen((value) => !value)}>
                {settingsOpen ? 'Готово' : 'Настроить'}
              </button>
            </div>
            {habitItems.map((habit) => {
              const done = Boolean(todayHabits[habit.code]);
              return (
                <button
                  className={`habit-item ${done ? 'done' : ''}`}
                  disabled={done || Boolean(marking) || settingsOpen}
                  key={habit.code}
                  onClick={() => handleHabit(habit.code)}
                >
                  <span className="habit-icon">{habit.icon}</span>
                  <span>
                    <strong>{habit.title}</strong>
                    <small>{habit.is_default ? 'Базовая' : 'Личная'} привычка</small>
                  </span>
                  <b>{marking === habit.code ? '...' : done ? '✓' : '+10'}</b>
                </button>
              );
            })}

            {settingsOpen && (
              <div className="habit-settings">
                <p>
                  Дополнительные привычки: {customHabitCount}/{customHabitLimit}
                </p>
                {habitItems.map((habit) => (
                  <div className={`habit-editor ${editingCode === habit.code ? 'editing' : ''}`} key={habit.code}>
                    {editingCode === habit.code ? (
                      <>
                        <input
                          className="emoji-input"
                          value={draftIcon}
                          onChange={(event) => setDraftIcon(event.target.value.slice(0, 4))}
                          maxLength={4}
                        />
                        <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} maxLength={32} />
                        <button disabled={habitAction === habit.code} onClick={() => saveHabitTitle(habit.code)}>
                          Сохранить
                        </button>
                      </>
                    ) : (
                      <>
                        <span>{habit.icon} {habit.title}</span>
                        <button
                          onClick={() => {
                            setEditingCode(habit.code);
                            setDraftTitle(habit.title);
                            setDraftIcon(habit.icon || '✅');
                          }}
                        >
                          Изменить
                        </button>
                        {!habit.is_default && <button onClick={() => deleteHabit(habit.code)}>Удалить</button>}
                      </>
                    )}
                  </div>
                ))}

                <div className="add-habit-row">
                  <input
                    className="emoji-input"
                    disabled={!canAddHabit}
                    maxLength={4}
                    value={newHabitIcon}
                    onChange={(event) => setNewHabitIcon(event.target.value.slice(0, 4))}
                  />
                  <input
                    disabled={!canAddHabit}
                    maxLength={32}
                    placeholder={canAddHabit ? 'Новая привычка' : 'Лимит подписки достигнут'}
                    value={newHabitTitle}
                    onChange={(event) => setNewHabitTitle(event.target.value)}
                  />
                  <button disabled={!canAddHabit || habitAction === 'add'} onClick={addHabit}>
                    Добавить
                  </button>
                </div>
                {!canAddHabit && <small>Free может менять базовые привычки. Base +1, PRO +2, VIP +3.</small>}
              </div>
            )}
            {message && <p className="toast-message">{message}</p>}
          </section>
        </section>
      )}

      {activeTab === 'trainings' && (
        <section className="screen">
          <div className="training-banner">
            <p className="eyebrow">Твой доступ: {subscriptionLabels[subscription]}</p>
            <h2>Выбирай тренировку под режим</h2>
            <p>Закрытые программы откроются после повышения подписки.</p>
          </div>

          <div className="training-list">
            {(trainings.length ? trainings : fallbackTrainings).map((training) => {
              const requiredSubscription = normalizeSubscription(training.subscription || training.level);
              const available = canOpen(subscription, requiredSubscription);
              return (
                <article className={`training-card ${available ? '' : 'locked'}`} key={training.id}>
                  <div>
                    <span className="training-meta">
                      {training.category || 'Программа'} · {subscriptionLabels[requiredSubscription]}
                    </span>
                    <h3>{training.title || training.name}</h3>
                    <p>{training.description || 'Тренировка будет доступна внутри программы Fitness Pooh.'}</p>
                  </div>
                  <button>{available ? 'Открыть' : '🔒'}</button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <nav className="bottom-nav">
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
          <span>👤</span>
          Профиль
        </button>
        <button className={activeTab === 'trainings' ? 'active' : ''} onClick={() => setActiveTab('trainings')}>
          <span>🏋️</span>
          Тренировки
        </button>
      </nav>
    </main>
  );
}

const fallbackTrainings: Training[] = [
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

export default App;
