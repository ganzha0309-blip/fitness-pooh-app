import { useEffect, useState } from 'react';
import './App.css';

import { LeaderboardModal } from './components/LeaderboardModal';
import { ProgressModals } from './components/ProgressModals';
import { TopMenu } from './components/TopMenu';
import { useAppBootstrap } from './hooks/useAppBootstrap';
import { useChallenges } from './hooks/useChallenges';
import { useProfile } from './hooks/useProfile';
import { useProgress } from './hooks/useProgress';
import { ChallengesScreen } from './screens/ChallengesScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { TrainingsScreen } from './screens/TrainingsScreen';
import type { Tab } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
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
  } = useProfile();
  const {
    initData,
    trainings,
    loading,
    error,
  } = useAppBootstrap(loadProfile);
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
  const {
    challenges,
    challengesLoading,
    challengeAction,
    challengeMessage,
    loadChallenges,
    challengeRequest,
  } = useChallenges({
    initData,
    refreshProfile: () => loadProfile(initData),
  });

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
        <p>{'\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c Fitness Pooh...'}</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="app-shell center-state">
        <div className="error-mark">!</div>
        <h1>{'\u041d\u0435 \u043f\u043e\u043b\u0443\u0447\u0438\u043b\u043e\u0441\u044c \u043e\u0442\u043a\u0440\u044b\u0442\u044c Mini App'}</h1>
        <p>{error || '\u041f\u0440\u043e\u0444\u0438\u043b\u044c \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d.'}</p>
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
