import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_URL = 'https://fitness-pooh-api.onrender.com';

type Tab = 'profile' | 'progress' | 'trainings';
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

type LeaderboardUser = {
  place: number;
  name: string;
  username?: string | null;
  xp: number;
  streak: number;
  level: string;
};

type LevelInfo = {
  xp: number;
  title: string;
};

type Leaderboard = {
  top: LeaderboardUser[];
  levels: LevelInfo[];
};

type ProgressEntry = {
  id: string;
  date: string;
  weight?: number | null;
  waist?: number | null;
  chest?: number | null;
  arm?: number | null;
  thigh?: number | null;
  note?: string;
};

type ProgressData = {
  entries: ProgressEntry[];
  latest?: ProgressEntry | null;
  changes?: Record<string, number>;
};

type ProgressForm = {
  weight: string;
  waist: string;
  chest: string;
  arm: string;
  thigh: string;
  note: string;
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
  const [draftCaption, setDraftCaption] = useState('');
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('✅');
  const [newHabitCaption, setNewHabitCaption] = useState('');
  const [habitAction, setHabitAction] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressSaving, setProgressSaving] = useState(false);
  const [progressForm, setProgressForm] = useState<ProgressForm>({
    weight: '',
    waist: '',
    chest: '',
    arm: '',
    thigh: '',
    note: '',
  });

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
        body: JSON.stringify({
          initData: tg.initData,
          code,
          title: draftTitle.trim(),
          icon: draftIcon.trim() || '✅',
          caption: draftCaption.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.detail || 'Не удалось сохранить привычку.');
      setProfile(result.profile);
      setEditingCode(null);
      setDraftTitle('');
      setDraftIcon('✅');
      setDraftCaption('');
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
        body: JSON.stringify({
          initData: tg.initData,
          title: newHabitTitle.trim(),
          icon: newHabitIcon.trim() || '✅',
          caption: newHabitCaption.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.detail || 'Лимит привычек для подписки достигнут.');
      setProfile(result.profile);
      setNewHabitTitle('');
      setNewHabitIcon('✅');
      setNewHabitCaption('');
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

  const openLeaderboard = async () => {
    setLeaderboardOpen(true);
    if (leaderboard) return;

    setLeaderboardLoading(true);
    try {
      const response = await fetch(`${API_URL}/leaderboard`);
      if (!response.ok) throw new Error('Не удалось загрузить топ.');
      setLeaderboard(await response.json());
    } catch {
      setMessage('Не удалось загрузить топ по XP.');
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!tg?.initData) return;
    setProgressLoading(true);
    try {
      const response = await fetch(`${API_URL}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData }),
      });
      if (!response.ok) throw new Error('Не удалось загрузить прогресс.');
      setProgress(await response.json());
    } catch {
      setMessage('Не удалось загрузить прогресс.');
    } finally {
      setProgressLoading(false);
    }
  };

  const saveProgress = async () => {
    if (!tg?.initData) return;
    setProgressSaving(true);
    try {
      const body = {
        initData: tg.initData,
        weight: progressForm.weight ? Number(progressForm.weight) : null,
        waist: progressForm.waist ? Number(progressForm.waist) : null,
        chest: progressForm.chest ? Number(progressForm.chest) : null,
        arm: progressForm.arm ? Number(progressForm.arm) : null,
        thigh: progressForm.thigh ? Number(progressForm.thigh) : null,
        note: progressForm.note,
      };
      const response = await fetch(`${API_URL}/progress/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.detail || 'Не удалось сохранить замер.');
      setProgress({ entries: result.entries, latest: result.latest, changes: result.changes });
      setProgressForm({ weight: '', waist: '', chest: '', arm: '', thigh: '', note: '' });
      setMessage('Замер сохранен.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Не удалось сохранить замер.');
    } finally {
      setProgressSaving(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'progress' && !progress) {
      loadProgress();
    }
  }, [activeTab, progress]);

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
          <h1>{activeTab === 'profile' ? 'Профиль' : activeTab === 'progress' ? 'Прогресс' : 'Тренировки'}</h1>
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
              <button className="top-button" onClick={openLeaderboard}>Топ</button>
            </div>
            <div className="level-subrow">
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
                    {habit.caption && <small>{habit.caption}</small>}
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
                        <input
                          className="caption-input"
                          value={draftCaption}
                          onChange={(event) => setDraftCaption(event.target.value)}
                          maxLength={48}
                          placeholder="Описание"
                        />
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
                            setDraftCaption(habit.caption || '');
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
                  <input
                    className="caption-input"
                    disabled={!canAddHabit}
                    maxLength={48}
                    placeholder="Описание"
                    value={newHabitCaption}
                    onChange={(event) => setNewHabitCaption(event.target.value)}
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

      {activeTab === 'progress' && (
        <section className="screen">
          <div className="training-banner">
            <p className="eyebrow">Замеры тела</p>
            <h2>Следи за массой и объемами</h2>
            <p>Добавляй замеры раз в неделю, чтобы видеть реальный прогресс, а не гадать по ощущениям.</p>
          </div>

          <section className="progress-card">
            <div className="section-title">
              <h3>Последний замер</h3>
              <button className="ghost-button" onClick={loadProgress}>Обновить</button>
            </div>
            {progressLoading ? (
              <p className="top-empty">Загружаем прогресс...</p>
            ) : progress?.latest ? (
              <div className="measure-grid">
                <article>
                  <span>Вес</span>
                  <strong>{progress.latest.weight ?? '-'} кг</strong>
                </article>
                <article>
                  <span>Талия</span>
                  <strong>{progress.latest.waist ?? '-'} см</strong>
                </article>
                <article>
                  <span>Грудь</span>
                  <strong>{progress.latest.chest ?? '-'} см</strong>
                </article>
                <article>
                  <span>Рука</span>
                  <strong>{progress.latest.arm ?? '-'} см</strong>
                </article>
                <article>
                  <span>Бедро</span>
                  <strong>{progress.latest.thigh ?? '-'} см</strong>
                </article>
                <article>
                  <span>Дата</span>
                  <strong>{progress.latest.date}</strong>
                </article>
              </div>
            ) : (
              <p className="top-empty">Пока нет замеров. Добавь первый ниже.</p>
            )}
          </section>

          <section className="progress-card">
            <div className="section-title">
              <h3>Новый замер</h3>
            </div>
            <div className="progress-form">
              {[
                ['weight', 'Вес, кг'],
                ['waist', 'Талия, см'],
                ['chest', 'Грудь, см'],
                ['arm', 'Рука, см'],
                ['thigh', 'Бедро, см'],
              ].map(([key, label]) => (
                <label key={key}>
                  <span>{label}</span>
                  <input
                    inputMode="decimal"
                    type="number"
                    step="0.1"
                    value={progressForm[key as keyof ProgressForm]}
                    onChange={(event) => setProgressForm((prev) => ({ ...prev, [key]: event.target.value }))}
                  />
                </label>
              ))}
              <label className="progress-note">
                <span>Комментарий</span>
                <input
                  maxLength={160}
                  value={progressForm.note}
                  onChange={(event) => setProgressForm((prev) => ({ ...prev, note: event.target.value }))}
                  placeholder="Например: после тренировки, утром натощак"
                />
              </label>
              <button className="save-progress-button" disabled={progressSaving} onClick={saveProgress}>
                {progressSaving ? 'Сохраняем...' : 'Сохранить замер'}
              </button>
            </div>
            {message && <p className="toast-message">{message}</p>}
          </section>

          <section className="progress-card">
            <div className="section-title">
              <h3>История</h3>
              <span>{progress?.entries?.length || 0}</span>
            </div>
            <div className="progress-history">
              {(progress?.entries || []).slice(0, 8).map((entry) => (
                <article key={entry.id}>
                  <div>
                    <strong>{entry.date}</strong>
                    {entry.note && <small>{entry.note}</small>}
                  </div>
                  <span>{entry.weight ? `${entry.weight} кг` : 'без веса'}</span>
                </article>
              ))}
              {!progress?.entries?.length && <p className="top-empty">История появится после первого замера.</p>}
            </div>
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

      {leaderboardOpen && (
        <section className="top-overlay">
          <div className="top-sheet">
            <div className="section-title">
              <h3>Топ Fitness Pooh</h3>
              <button className="ghost-button" onClick={() => setLeaderboardOpen(false)}>Закрыть</button>
            </div>

            {leaderboardLoading ? (
              <p className="top-empty">Загружаем рейтинг...</p>
            ) : (
              <>
                <div className="top-list">
                  {(leaderboard?.top || []).map((user) => (
                    <article className="top-user" key={`${user.place}-${user.name}`}>
                      <span className="top-place">#{user.place}</span>
                      <div>
                        <strong>{user.name}</strong>
                        <small>{user.level} · {user.streak} дн.</small>
                      </div>
                      <b>{user.xp} XP</b>
                    </article>
                  ))}
                  {!leaderboard?.top?.length && <p className="top-empty">Пока нет участников рейтинга.</p>}
                </div>

                <div className="levels-list">
                  <h3>Уровни</h3>
                  {(leaderboard?.levels || []).map((level) => (
                    <div className="level-item" key={level.xp}>
                      <span>{level.title}</span>
                      <b>{level.xp} XP</b>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      <nav className="bottom-nav">
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
          <span>👤</span>
          Профиль
        </button>
        <button className={activeTab === 'progress' ? 'active' : ''} onClick={() => setActiveTab('progress')}>
          <span>📈</span>
          Прогресс
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
