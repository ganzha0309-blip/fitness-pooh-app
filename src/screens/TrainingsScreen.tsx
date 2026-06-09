import { canOpen, fallbackTrainings, normalizeSubscription, subscriptionLabels } from '../constants';
import type { Training } from '../types';

type TrainingsScreenProps = {
  subscription: string;
  trainings: Training[];
};

export function TrainingsScreen({ subscription, trainings }: TrainingsScreenProps) {
  const visibleTrainings = trainings.length ? trainings : fallbackTrainings;

  return (
    <section className="screen">
      <div className="training-banner">
        <p className="eyebrow">Твой доступ: {subscriptionLabels[subscription]}</p>
        <h2>Выбирай тренировку под режим</h2>
        <p>Закрытые программы откроются после повышения подписки.</p>
      </div>

      <div className="training-list">
        {visibleTrainings.map((training) => {
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
  );
}
