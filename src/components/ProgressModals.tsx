import type { Dispatch, SetStateAction } from 'react';

import { progressMetrics } from '../constants';
import type { ProgressEntry, ProgressForm } from '../types';

type ProgressModalsProps = {
  formOpen: boolean;
  progressForm: ProgressForm;
  progressSaving: boolean;
  progressMessage: string;
  progressDetail: ProgressEntry | null;
  progressDeleteTarget: ProgressEntry | null;
  deletingProgressId: string | null;
  setProgressForm: Dispatch<SetStateAction<ProgressForm>>;
  onCloseForm: () => void;
  onSaveProgress: () => void;
  onCloseDetail: () => void;
  onRequestDelete: (entry: ProgressEntry) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (entryId: string) => Promise<void>;
};

const progressFormFields: [keyof Omit<ProgressForm, 'note'>, string][] = [
  ['weight', 'Вес, кг'],
  ['waist', 'Талия, см'],
  ['chest', 'Грудь, см'],
  ['arm', 'Рука, см'],
  ['thigh', 'Бедро, см'],
];

export function ProgressModals({
  formOpen,
  progressForm,
  progressSaving,
  progressMessage,
  progressDetail,
  progressDeleteTarget,
  deletingProgressId,
  setProgressForm,
  onCloseForm,
  onSaveProgress,
  onCloseDetail,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: ProgressModalsProps) {
  return (
    <>
      {formOpen && (
        <section className="top-overlay">
          <div className="top-sheet progress-entry-sheet">
            <div className="section-title">
              <h3>Новый замер</h3>
              <button className="ghost-button" onClick={onCloseForm}>Закрыть</button>
            </div>
            <div className="progress-form progress-form-sheet">
              {progressFormFields.map(([key, label]) => (
                <label key={key}>
                  <span>{label}</span>
                  <input
                    inputMode="decimal"
                    type="number"
                    step="0.1"
                    value={progressForm[key]}
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
                  placeholder="Например: утром натощак"
                />
              </label>
              <button className="save-progress-button" disabled={progressSaving} onClick={onSaveProgress}>
                {progressSaving ? 'Сохраняем...' : 'Сохранить замер'}
              </button>
            </div>
            {progressMessage && <p className="toast-message">{progressMessage}</p>}
          </div>
        </section>
      )}

      {progressDetail && (
        <section className="top-overlay">
          <div className="top-sheet progress-detail-sheet">
            <div className="section-title">
              <h3>Замер от {progressDetail.date}</h3>
              <button className="ghost-button" onClick={onCloseDetail}>Закрыть</button>
            </div>
            <div className="measure-grid">
              {progressMetrics.map((metric) => (
                <article key={metric.key}>
                  <span>{metric.label}</span>
                  <strong>
                    {progressDetail[metric.key] ?? '-'} {metric.unit}
                  </strong>
                </article>
              ))}
              <article>
                <span>Дата</span>
                <strong>{progressDetail.date}</strong>
              </article>
            </div>
            {progressDetail.note && (
              <div className="progress-detail-note">
                <span>Комментарий</span>
                <p>{progressDetail.note}</p>
              </div>
            )}
            <button
              className="danger-button progress-detail-delete"
              disabled={deletingProgressId === progressDetail.id}
              onClick={() => onRequestDelete(progressDetail)}
            >
              {deletingProgressId === progressDetail.id ? 'Удаляем...' : 'Удалить замер'}
            </button>
          </div>
        </section>
      )}

      {progressDeleteTarget && (
        <section className="top-overlay">
          <div className="top-sheet confirm-sheet">
            <div className="section-title">
              <h3>Удалить замер?</h3>
            </div>
            <p className="confirm-text">
              Замер от {progressDeleteTarget.date} будет удален из истории. Это действие нельзя отменить.
            </p>
            <div className="confirm-actions">
              <button className="ghost-button" onClick={onCancelDelete}>Отмена</button>
              <button
                className="danger-button"
                disabled={deletingProgressId === progressDeleteTarget.id}
                onClick={() => onConfirmDelete(progressDeleteTarget.id)}
              >
                {deletingProgressId === progressDeleteTarget.id ? 'Удаляем...' : 'Удалить'}
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
