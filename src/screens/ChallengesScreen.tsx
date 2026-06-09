import { normalizeSubscription, subscriptionLabels } from '../constants';
import type { Challenge } from '../types';

type ChallengesScreenProps = {
  subscription: string;
  challenges: Challenge[];
  loading: boolean;
  actionId: string | null;
  message: string;
  onRefresh: () => void;
  onChallengeAction: (challengeId: string, action: 'join' | 'check') => void;
};

export function ChallengesScreen({
  subscription,
  challenges,
  loading,
  actionId,
  message,
  onRefresh,
  onChallengeAction,
}: ChallengesScreenProps) {
  return (
    <section className="screen">
      <div className="training-banner">
        <p className="eyebrow">Твой доступ: {subscriptionLabels[subscription]}</p>
        <h2>Челленджи Fitness Pooh</h2>
        <p>Выбирай цель, вступай и отмечай выполнение каждый день. Закрытые челленджи откроются с подпиской выше.</p>
        <button className="new-progress-button" onClick={onRefresh}>
          Обновить
        </button>
      </div>

      <div className="challenge-list">
        {loading ? (
          <p className="top-empty">Загружаем челленджи...</p>
        ) : (
          challenges.map((challenge) => {
            const locked = !challenge.available;
            const completed = challenge.participant_status === 'completed';
            const progressPercent = Math.min(100, Math.round((challenge.progress_days / challenge.duration_days) * 100));
            return (
              <article className={`challenge-card ${locked ? 'locked' : ''}`} key={challenge.id}>
                <div className="challenge-card-body">
                  <div className="challenge-card-head">
                    <span>{subscriptionLabels[normalizeSubscription(challenge.required_subscription)]}</span>
                    <b>{challenge.participants_count} уч.</b>
                  </div>
                  <h3>{challenge.title}</h3>
                  <p>{challenge.description}</p>
                  <div className="challenge-meta">
                    <span>{challenge.duration_days} дн.</span>
                    <span>{challenge.reward_xp} XP</span>
                    <span>{challenge.progress_days}/{challenge.duration_days}</span>
                  </div>
                  <div className="progress-track challenge-track">
                    <div style={{ width: `${progressPercent}%` }} />
                  </div>
                  {!locked && (
                    <button
                      disabled={actionId === challenge.id || completed || challenge.done_today}
                      onClick={() => onChallengeAction(challenge.id, challenge.joined ? 'check' : 'join')}
                    >
                      {actionId === challenge.id
                        ? '...'
                        : completed
                          ? 'Выполнен'
                          : challenge.done_today
                            ? 'Сегодня зачтено'
                            : challenge.joined
                              ? 'Отметить день'
                              : 'Участвовать'}
                    </button>
                  )}
                </div>
                {locked && (
                  <div className="challenge-lock">
                    <strong>Доступно с {subscriptionLabels[normalizeSubscription(challenge.required_subscription)]}</strong>
                    <span>Челлендж виден заранее, но участие откроется после повышения подписки.</span>
                  </div>
                )}
              </article>
            );
          })
        )}
        {!loading && !challenges.length && <p className="top-empty">Пока нет активных челленджей.</p>}
      </div>
      {message && <p className="toast-message">{message}</p>}
    </section>
  );
}
