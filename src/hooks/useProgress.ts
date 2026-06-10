import { useMemo, useState } from 'react';

import {
  addProgress as addProgressApi,
  deleteProgress as deleteProgressApi,
  fetchProgress,
} from '../api/client';
import { progressMetrics } from '../constants';
import type { ProgressData, ProgressEntry, ProgressForm, ProgressMetric } from '../types';
import { buildProgressChart } from '../utils/progressChart';

const emptyProgressForm: ProgressForm = {
  weight: '',
  waist: '',
  chest: '',
  arm: '',
  thigh: '',
  note: '',
};

export function useProgress(initData?: string) {
  const [progressMessage, setProgressMessage] = useState('');
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressSaving, setProgressSaving] = useState(false);
  const [deletingProgressId, setDeletingProgressId] = useState<string | null>(null);
  const [progressFormOpen, setProgressFormOpen] = useState(false);
  const [progressDeleteTarget, setProgressDeleteTarget] = useState<ProgressEntry | null>(null);
  const [progressDetail, setProgressDetail] = useState<ProgressEntry | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<ProgressMetric>('weight');
  const [progressForm, setProgressForm] = useState<ProgressForm>(emptyProgressForm);

  const selectedMetricInfo = progressMetrics.find((metric) => metric.key === selectedMetric) || progressMetrics[0];
  const progressChart = useMemo(
    () => buildProgressChart(progress, selectedMetric),
    [progress, selectedMetric],
  );

  const loadProgress = async () => {
    if (!initData) return;

    setProgressLoading(true);
    try {
      setProgress(await fetchProgress(initData));
    } catch {
      setProgressMessage('Не удалось загрузить прогресс.');
    } finally {
      setProgressLoading(false);
    }
  };

  const openProgressForm = () => {
    setProgressMessage('');
    setProgressFormOpen(true);
  };

  const saveProgress = async () => {
    if (!initData) return;

    setProgressSaving(true);
    try {
      const body = {
        weight: progressForm.weight ? Number(progressForm.weight) : null,
        waist: progressForm.waist ? Number(progressForm.waist) : null,
        chest: progressForm.chest ? Number(progressForm.chest) : null,
        arm: progressForm.arm ? Number(progressForm.arm) : null,
        thigh: progressForm.thigh ? Number(progressForm.thigh) : null,
        note: progressForm.note,
      };
      setProgress(await addProgressApi(initData, body));
      setProgressForm(emptyProgressForm);
      setProgressFormOpen(false);
      setProgressMessage('Замер сохранен.');
    } catch (err) {
      setProgressMessage(err instanceof Error ? err.message : 'Не удалось сохранить замер.');
    } finally {
      setProgressSaving(false);
    }
  };

  const deleteProgress = async (entryId: string) => {
    if (!initData) return;

    setDeletingProgressId(entryId);
    try {
      setProgress(await deleteProgressApi(initData, entryId));
      setProgressDetail(null);
      setProgressMessage('Замер удален.');
    } catch (err) {
      setProgressMessage(err instanceof Error ? err.message : 'Не удалось удалить замер.');
    } finally {
      setDeletingProgressId(null);
    }
  };

  return {
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
  };
}
