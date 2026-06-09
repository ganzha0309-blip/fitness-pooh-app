import type { Dispatch, SetStateAction } from 'react';

import { subscriptionLabels } from '../constants';
import type { HabitItem, Profile } from '../types';

type ProfileScreenProps = {
  profile: Profile;
  subscription: string;
  habitItems: HabitItem[];
  todayHabits: Record<string, number>;
  completedHabits: number;
  nextXp: number;
  levelProgress: number;
  marking: string | null;
  habitMessage: string;
  settingsOpen: boolean;
  editingCode: string | null;
  draftTitle: string;
  draftIcon: string;
  draftCaption: string;
  newHabitTitle: string;
  newHabitIcon: string;
  newHabitCaption: string;
  habitAction: string | null;
  customHabitCount: number;
  customHabitLimit: number;
  canAddHabit: boolean;
  onOpenLeaderboard: () => void;
  onToggleSettings: () => void;
  onMarkHabit: (code: string) => void;
  onSaveHabit: (code: string) => void;
  onDeleteHabit: (code: string) => void;
  onAddHabit: () => void;
  setEditingCode: Dispatch<SetStateAction<string | null>>;
  setDraftTitle: Dispatch<SetStateAction<string>>;
  setDraftIcon: Dispatch<SetStateAction<string>>;
  setDraftCaption: Dispatch<SetStateAction<string>>;
  setNewHabitTitle: Dispatch<SetStateAction<string>>;
  setNewHabitIcon: Dispatch<SetStateAction<string>>;
  setNewHabitCaption: Dispatch<SetStateAction<string>>;
};

export function ProfileScreen({
  profile,
  subscription,
  habitItems,
  todayHabits,
  completedHabits,
  nextXp,
  levelProgress,
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
  customHabitCount,
  customHabitLimit,
  canAddHabit,
  onOpenLeaderboard,
  onToggleSettings,
  onMarkHabit,
  onSaveHabit,
  onDeleteHabit,
  onAddHabit,
  setEditingCode,
  setDraftTitle,
  setDraftIcon,
  setDraftCaption,
  setNewHabitTitle,
  setNewHabitIcon,
  setNewHabitCaption,
}: ProfileScreenProps) {
  return (
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
          <button className="top-button" onClick={onOpenLeaderboard}>Топ</button>
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
          <button className="ghost-button" onClick={onToggleSettings}>
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
              onClick={() => onMarkHabit(habit.code)}
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
                    <button disabled={habitAction === habit.code} onClick={() => onSaveHabit(habit.code)}>
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
                    {!habit.is_default && <button onClick={() => onDeleteHabit(habit.code)}>Удалить</button>}
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
              <button disabled={!canAddHabit || habitAction === 'add'} onClick={onAddHabit}>
                Добавить
              </button>
            </div>
            {!canAddHabit && <small>Free может менять базовые привычки. Base +1, PRO +2, VIP +3.</small>}
          </div>
        )}
        {habitMessage && <p className="toast-message">{habitMessage}</p>}
      </section>
    </section>
  );
}
