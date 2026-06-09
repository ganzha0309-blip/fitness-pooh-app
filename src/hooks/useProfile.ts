import { useMemo, useState } from 'react';

import {
  addHabit as addHabitApi,
  deleteHabit as deleteHabitApi,
  editHabit,
  fetchLeaderboard,
  fetchProfile,
  markHabit,
} from '../api/client';
import { defaultHabits, nextLevelXp, normalizeSubscription, todayIso } from '../constants';
import type { Leaderboard, Profile } from '../types';

export function useProfile(initData?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [marking, setMarking] = useState<string | null>(null);
  const [habitMessage, setHabitMessage] = useState('');
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

  const getInitData = (overrideInitData?: string) => overrideInitData || initData;

  const loadProfile = async (overrideInitData?: string) => {
    const activeInitData = getInitData(overrideInitData);
    if (!activeInitData) {
      return null;
    }

    const data = await fetchProfile(activeInitData);
    setProfile(data);
    return data;
  };

  const handleHabit = async (habit: string) => {
    const activeInitData = getInitData();
    if (!profile || !activeInitData) return;

    setMarking(habit);
    setHabitMessage('');
    try {
      const result = await markHabit(activeInitData, habit);

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
        await loadProfile(activeInitData);
        setHabitMessage(result.message || 'Эта привычка уже отмечена сегодня.');
      }
    } catch {
      setHabitMessage('Не удалось связаться с сервером.');
    } finally {
      setMarking(null);
    }
  };

  const saveHabitTitle = async (code: string) => {
    const activeInitData = getInitData();
    if (!activeInitData || draftTitle.trim().length < 2) return;

    setHabitAction(code);
    try {
      const updatedProfile = await editHabit(activeInitData, {
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
    const activeInitData = getInitData();
    if (!activeInitData || newHabitTitle.trim().length < 2 || !canAddHabit) return;

    setHabitAction('add');
    try {
      const updatedProfile = await addHabitApi(activeInitData, {
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
    const activeInitData = getInitData();
    if (!activeInitData) return;

    setHabitAction(code);
    try {
      setProfile(await deleteHabitApi(activeInitData, code));
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

  return {
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
  };
}
