import { useEffect, useMemo, useState } from 'react';
import './App.css';

import {
  addHabit as addHabitApi,
  addProgress as addProgressApi,
  deleteHabit as deleteHabitApi,
  deleteProgress as deleteProgressApi,
  editHabit,
  fetchChallenges,
  fetchLeaderboard,
  fetchProfile,
  fetchProgress,
  fetchTrainings,
  markHabit,
  updateChallenge,
} from './api/client';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ProgressModals } from './components/ProgressModals';
import { TopMenu } from './components/TopMenu';
import {
  defaultHabits,
  nextLevelXp,
  normalizeSubscription,
  progressMetrics,
  todayIso,
} from './constants';
import { ChallengesScreen } from './screens/ChallengesScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { TrainingsScreen } from './screens/TrainingsScreen';
import type {
  Challenge,
  Leaderboard,
  Profile,
  ProgressData,
  ProgressEntry,
  ProgressForm,
  ProgressMetric,
  Tab,
  Training,
} from './types';
import { buildProgressChart } from './utils/progressChart';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState<string | null>(null);
  const [habitMessage, setHabitMessage] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
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
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [challengeAction, setChallengeAction] = useState<string | null>(null);
  const [challengeMessage, setChallengeMessage] = useState('');
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressSaving, setProgressSaving] = useState(false);
  const [deletingProgressId, setDeletingProgressId] = useState<string | null>(null);
  const [progressFormOpen, setProgressFormOpen] = useState(false);
  const [progressDeleteTarget, setProgressDeleteTarget] = useState<ProgressEntry | null>(null);
  const [progressDetail, setProgressDetail] = useState<ProgressEntry | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<ProgressMetric>('weight');
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
  const selectedMetricInfo = progressMetrics.find((metric) => metric.key === selectedMetric) || progressMetrics[0];
  const progressChart = useMemo(
    () => buildProgressChart(progress, selectedMetric),
    [progress, selectedMetric],
  );

  const completedHabits = useMemo(
    () => habitItems.filter((habit) => todayHabits[habit.code]).length,
    [habitItems, todayHabits],
  );

  const loadProfile = async (initData: string) => {
    const data = await fetchProfile(initData);
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

        setTrainings(await fetchTrainings());
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
    setHabitMessage('');
    try {
      const result = await markHabit(tg.initData, habit);

      if (result.ok) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                xp: result.new_xp ?? prev.xp,
                streak: result.new_streak ?? prev.streak,
                level: result.level ?? prev.level,
                last_action_date: todayIso(),
                habits: result.habits || { ...(prev.last_action_date === todayIso() ? prev.habits : {}), [habit]: 1 },
                habit_items: result.habit_items || prev.habit_items,
              }
            : prev,
        );
        setHabitMessage(result.message || '+10 XP в копилку режима.');
      } else {
        await loadProfile(tg.initData);
        setHabitMessage(result.message || 'Эта привычка уже отмечена сегодня.');
      }
    } catch {
      setHabitMessage('Не удалось связаться с сервером.');
    } finally {
      setMarking(null);
    }
  };

  const saveHabitTitle = async (code: string) => {
    if (!tg?.initData || draftTitle.trim().length < 2) return;
    setHabitAction(code);
    try {
      const updatedProfile = await editHabit(tg.initData, {
        code,
        title: draftTitle.trim(),
        icon: draftIcon.trim() || '✅',
        caption: draftCaption.trim(),
      });
      setProfile(updatedProfile);
      setEditingCode(null);
      setDraftTitle('');
      setDraftIcon('✅');
      setDraftCaption('');
      setHabitMessage('Привычка обновлена.');
    } catch (err) {
      setHabitMessage(err instanceof Error ? err.message : 'Не удалось сохранить привычку.');
    } finally {
      setHabitAction(null);
    }
  };

  const addHabit = async () => {
    if (!tg?.initData || newHabitTitle.trim().length < 2 || !canAddHabit) return;
    setHabitAction('add');
    try {
      const updatedProfile = await addHabitApi(tg.initData, {
        title: newHabitTitle.trim(),
        icon: newHabitIcon.trim() || '✅',
        caption: newHabitCaption.trim(),
      });
      setProfile(updatedProfile);
      setNewHabitTitle('');
      setNewHabitIcon('✅');
      setNewHabitCaption('');
      setHabitMessage('Привычка добавлена.');
    } catch (err) {
      setHabitMessage(err instanceof Error ? err.message : 'Не удалось добавить привычку.');
    } finally {
      setHabitAction(null);
    }
  };

  const deleteHabit = async (code: string) => {
    if (!tg?.initData) return;
    setHabitAction(code);
    try {
      setProfile(await deleteHabitApi(tg.initData, code));
      setHabitMessage('Привычка удалена.');
    } catch (err) {
      setHabitMessage(err instanceof Error ? err.message : 'Не удалось удалить привычку.');
    } finally {
      setHabitAction(null);
    }
  };

  const openLeaderboard = async () => {
    setLeaderboardOpen(true);
    if (leaderboard) return;

    setLeaderboardLoading(true);
    try {
      setLeaderboard(await fetchLeaderboard());
    } catch {
      setHabitMessage('Не удалось загрузить топ по XP.');
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!tg?.initData) return;
    setProgressLoading(true);
    try {
      setProgress(await fetchProgress(tg.initData));
    } catch {
      setProgressMessage('Не удалось загрузить прогресс.');
    } finally {
      setProgressLoading(false);
    }
  };

  const loadChallenges = async () => {
    if (!tg?.initData) return;
    setChallengesLoading(true);
    try {
      setChallenges(await fetchChallenges(tg.initData));
    } catch (err) {
      setChallengeMessage(err instanceof Error ? err.message : 'Не удалось загрузить челленджи.');
    } finally {
      setChallengesLoading(false);
    }
  };

  const challengeRequest = async (challengeId: string, action: 'join' | 'check') => {
    if (!tg?.initData) return;
    setChallengeAction(challengeId);
    setChallengeMessage('');
    try {
      setChallenges(await updateChallenge(tg.initData, challengeId, action));
      setChallengeMessage(action === 'join' ? 'Ты участвуешь в челлендже.' : 'День засчитан.');
      if (action === 'check') {
        await loadProfile(tg.initData);
      }
    } catch (err) {
      setChallengeMessage(err instanceof Error ? err.message : 'Не удалось обновить челлендж.');
    } finally {
      setChallengeAction(null);
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
      setProgress(await addProgressApi(tg.initData, body));
      setProgressForm({ weight: '', waist: '', chest: '', arm: '', thigh: '', note: '' });
      setProgressFormOpen(false);
      setProgressMessage('Замер сохранен.');
    } catch (err) {
      setProgressMessage(err instanceof Error ? err.message : 'Не удалось сохранить замер.');
    } finally {
      setProgressSaving(false);
    }
  };

  const deleteProgress = async (entryId: string) => {
    if (!tg?.initData) return;
    setDeletingProgressId(entryId);
    try {
      setProgress(await deleteProgressApi(tg.initData, entryId));
      setProgressDetail(null);
      setProgressMessage('Замер удален.');
    } catch (err) {
      setProgressMessage(err instanceof Error ? err.message : 'Не удалось удалить замер.');
    } finally {
      setDeletingProgressId(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'progress' && !progress) {
      loadProgress();
    }
  }, [activeTab, progress]);

  useEffect(() => {
    if (activeTab === 'challenges') {
      loadChallenges();
    }
  }, [activeTab]);

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
      <TopMenu
        activeTab={activeTab}
        profile={profile}
        subscription={subscription}
        onTabChange={setActiveTab}
      />

      {activeTab === 'profile' && (
        <ProfileScreen
          profile={profile}
          subscription={subscription}
          habitItems={habitItems}
          todayHabits={todayHabits}
          completedHabits={completedHabits}
          nextXp={nextXp}
          levelProgress={levelProgress}
          marking={marking}
          habitMessage={habitMessage}
          settingsOpen={settingsOpen}
          editingCode={editingCode}
          draftTitle={draftTitle}
          draftIcon={draftIcon}
          draftCaption={draftCaption}
          newHabitTitle={newHabitTitle}
          newHabitIcon={newHabitIcon}
          newHabitCaption={newHabitCaption}
          habitAction={habitAction}
          customHabitCount={customHabitCount}
          customHabitLimit={customHabitLimit}
          canAddHabit={canAddHabit}
          onOpenLeaderboard={openLeaderboard}
          onToggleSettings={() => setSettingsOpen((value) => !value)}
          onMarkHabit={handleHabit}
          onSaveHabit={saveHabitTitle}
          onDeleteHabit={deleteHabit}
          onAddHabit={addHabit}
          setEditingCode={setEditingCode}
          setDraftTitle={setDraftTitle}
          setDraftIcon={setDraftIcon}
          setDraftCaption={setDraftCaption}
          setNewHabitTitle={setNewHabitTitle}
          setNewHabitIcon={setNewHabitIcon}
          setNewHabitCaption={setNewHabitCaption}
        />
      )}

      {activeTab === 'progress' && (
        <ProgressScreen
          subscription={subscription}
          progress={progress}
          progressLoading={progressLoading}
          progressMessage={progressMessage}
          selectedMetric={selectedMetric}
          selectedMetricUnit={selectedMetricInfo.unit}
          progressChart={progressChart}
          onRefresh={loadProgress}
          onOpenForm={() => {
            setProgressMessage('');
            setProgressFormOpen(true);
          }}
          onSelectMetric={setSelectedMetric}
          onOpenEntry={setProgressDetail}
        />
      )}

      {activeTab === 'challenges' && (
        <ChallengesScreen
          subscription={subscription}
          challenges={challenges}
          loading={challengesLoading}
          actionId={challengeAction}
          message={challengeMessage}
          onRefresh={loadChallenges}
          onChallengeAction={challengeRequest}
        />
      )}

      {activeTab === 'trainings' && (
        <TrainingsScreen subscription={subscription} trainings={trainings} />
      )}

      <ProgressModals
        formOpen={progressFormOpen}
        progressForm={progressForm}
        progressSaving={progressSaving}
        progressMessage={progressMessage}
        progressDetail={progressDetail}
        progressDeleteTarget={progressDeleteTarget}
        deletingProgressId={deletingProgressId}
        setProgressForm={setProgressForm}
        onCloseForm={() => setProgressFormOpen(false)}
        onSaveProgress={saveProgress}
        onCloseDetail={() => setProgressDetail(null)}
        onRequestDelete={(entry) => {
          setProgressDeleteTarget(entry);
          setProgressDetail(null);
        }}
        onCancelDelete={() => setProgressDeleteTarget(null)}
        onConfirmDelete={async (entryId) => {
          await deleteProgress(entryId);
          setProgressDeleteTarget(null);
        }}
      />

      <LeaderboardModal
        open={leaderboardOpen}
        loading={leaderboardLoading}
        leaderboard={leaderboard}
        onClose={() => setLeaderboardOpen(false)}
      />

    </main>
  );
}

export default App;
