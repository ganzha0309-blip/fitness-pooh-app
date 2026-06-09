import type { ProgressData, ProgressMetric } from '../types';

export function buildProgressChart(progress: ProgressData | null, selectedMetric: ProgressMetric) {
  const entries = (progress?.entries || [])
    .filter((entry) => typeof entry[selectedMetric] === 'number')
    .slice()
    .sort((left, right) => {
      const leftTime = left.created_at || left.date;
      const rightTime = right.created_at || right.date;
      return leftTime.localeCompare(rightTime);
    })
    .slice(-8);

  if (!entries.length) {
    return { points: [] };
  }

  const weights = entries.map((entry) => Number(entry[selectedMetric]));
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = Math.max(max - min, 1);
  const points = entries.map((entry, index) => {
    const x = entries.length === 1 ? 50 : 8 + (index / (entries.length - 1)) * 84;
    const y = 82 - ((Number(entry[selectedMetric]) - min) / range) * 64;
    return { x, y, entry };
  });

  return { points };
}
