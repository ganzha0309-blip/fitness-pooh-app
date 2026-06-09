import type { Leaderboard } from '../types';

type LeaderboardModalProps = {
  open: boolean;
  loading: boolean;
  leaderboard: Leaderboard | null;
  onClose: () => void;
};

export function LeaderboardModal({ open, loading, leaderboard, onClose }: LeaderboardModalProps) {
  if (!open) {
    return null;
  }

  return (
    <section className="top-overlay">
      <div className="top-sheet">
        <div className="section-title">
          <h3>Топ Fitness Pooh</h3>
          <button className="ghost-button" onClick={onClose}>Закрыть</button>
        </div>

        {loading ? (
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
  );
}
