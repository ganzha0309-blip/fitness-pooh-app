import { canOpen, progressMetrics } from '../constants';
import type { ProgressData, ProgressEntry, ProgressMetric } from '../types';
import type { buildProgressChart } from '../utils/progressChart';

type ProgressChart = ReturnType<typeof buildProgressChart>;

type ProgressScreenProps = {
  subscription: string;
  progress: ProgressData | null;
  progressLoading: boolean;
  progressMessage: string;
  selectedMetric: ProgressMetric;
  selectedMetricUnit: string;
  progressChart: ProgressChart;
  onRefresh: () => void;
  onOpenForm: () => void;
  onSelectMetric: (metric: ProgressMetric) => void;
  onOpenEntry: (entry: ProgressEntry) => void;
};

export function ProgressScreen({
  subscription,
  progress,
  progressLoading,
  progressMessage,
  selectedMetric,
  selectedMetricUnit,
  progressChart,
  onRefresh,
  onOpenForm,
  onSelectMetric,
  onOpenEntry,
}: ProgressScreenProps) {
  return (
    <section className="screen">
      <div className="training-banner">
        <p className="eyebrow">Прогресс</p>
        <h2>Следи за массой и объемами</h2>
        <p>Добавляй замеры раз в неделю, чтобы видеть реальный прогресс, а не гадать по ощущениям.</p>
        <button className="new-progress-button" onClick={onOpenForm}>
          Новый замер
        </button>
      </div>

      <section className="progress-card">
        <div className="section-title">
          <h3>Последний замер</h3>
          <button className="ghost-button" onClick={onRefresh}>Обновить</button>
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
          <h3>Аналитика</h3>
          <span>Base+</span>
        </div>
        <div className={`progress-chart-card ${canOpen(subscription, 'base') ? '' : 'locked'}`}>
          <div className="metric-tabs">
            {progressMetrics.map((metric) => (
              <button
                className={selectedMetric === metric.key ? 'active' : ''}
                key={metric.key}
                onClick={() => onSelectMetric(metric.key)}
              >
                {metric.label}
              </button>
            ))}
          </div>
          <div className="chart-preview">
            {progressChart.points.length >= 2 ? (
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <polyline
                  points={progressChart.points.map((point) => `${point.x},${point.y}`).join(' ')}
                />
              </svg>
            ) : (
              <div className="chart-empty-line" />
            )}
            {progressChart.points.length >= 2 && (
              <div className="chart-dots">
                {progressChart.points.map((point) => (
                  <span key={`${point.entry.date}-${point.entry[selectedMetric]}`} style={{ left: `${point.x}%`, top: `${point.y}%` }} />
                ))}
              </div>
            )}
          </div>
          <div className="chart-meta">
            <span>{progressChart.points[0]?.entry.date || 'нет данных'}</span>
            <strong>
              {progressChart.points.length >= 2
                ? `${progressChart.points[progressChart.points.length - 1].entry[selectedMetric]} ${selectedMetricUnit}`
                : 'Добавь 2 замера'}
            </strong>
            <span>{progressChart.points[progressChart.points.length - 1]?.entry.date || ''}</span>
          </div>
          {!canOpen(subscription, 'base') && (
            <div className="chart-lock">
              <strong>Аналитика доступна с Base</strong>
              <span>С Base открываются графики веса и всех объемов по истории замеров.</span>
            </div>
          )}
        </div>
      </section>

      <section className="progress-card">
        <div className="section-title">
          <h3>История</h3>
          <span>{progress?.entries?.length || 0}</span>
        </div>
        <div className="progress-history">
          {(progress?.entries || []).slice(0, 8).map((entry) => (
            <article className="progress-history-item" key={entry.id} onClick={() => onOpenEntry(entry)}>
              <div>
                <strong>{entry.date}</strong>
                {entry.note && <small>{entry.note}</small>}
              </div>
              <span>{entry.weight ? `${entry.weight} кг` : 'без веса'}</span>
              <b>Открыть</b>
            </article>
          ))}
          {!progress?.entries?.length && <p className="top-empty">История появится после первого замера.</p>}
        </div>
      </section>
      {progressMessage && <p className="toast-message">{progressMessage}</p>}
    </section>
  );
}
