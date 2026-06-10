import { useEffect, useState } from 'react';
import './App.css';

import {
  fetchChallenges,
  fetchTrainings,
  updateChallenge,
} from './api/client';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ProgressModals } from './components/ProgressModals';
import { TopMenu } from './components/TopMenu';
import { useProfile } from './hooks/useProfile';
import { useProgress } from './hooks/useProgress';
import { ChallengesScreen } from './screens/ChallengesScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { TrainingsScreen } from './screens/TrainingsScreen';
import type {
  Challenge,
  Tab,
  Training,
} from './types';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [challengeAction, setChallengeAction] = useState<string | null>(null);
  const [challengeMessage, setChallengeMessage] = useState('');

  const tg = (window as any).Telegram?.WebApp;
  const initData = tg?.initData;
  const {
    profile,
    habitItems,
    todayHabits,
    subscription,
    customHabitLimit,
    customHabitCount,
    canAddHabit,
    nextXp,
    levelProgress,
    completedHabits,
    marking,
    habitMessage,
    settingsOpen,
    editingCode,
    draftTitle,
    draftIcon,
    draftCaption,
    newHabitTitle,
    newHabitIcon,
    newHabitCaption,
    habitAction,
    leaderboard,
    leaderboardOpen,
    leaderboardLoading,
    loadProfile,
    handleHabit,
    saveHabitTitle,
    addHabit,
    deleteHabit,
    openLeaderboard,
    setSettingsOpen,
    setEditingCode,
    setDraftTitle,
    setDraftIcon,
    setDraftCaption,
    setNewHabitTitle,
    setNewHabitIcon,
    setNewHabitCaption,
    setLeaderboardOpen,
  } = useProfile(initData);
  const {
    progress,
    progressLoading,
    progressSaving,
    progressMessage,
    deletingProgressId,
    progressFormOpen,
    progressDeleteTarget,
    progressDetail,
    selectedMetric,
    selectedMetricInfo,
    progressChart,
    progressForm,
    loadProgress,
    openProgressForm,
    saveProgress,
    deleteProgress,
    setProgressForm,
    setProgressFormOpen,
    setProgressDeleteTarget,
    setProgressDetail,
    setSelectedMetric,
  } = useProgress(initData);

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
          onOpenForm={openProgressForm}
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
