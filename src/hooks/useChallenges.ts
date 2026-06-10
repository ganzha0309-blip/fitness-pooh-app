import { useState } from 'react';

import { fetchChallenges, updateChallenge } from '../api/client';
import type { Challenge } from '../types';

type UseChallengesOptions = {
  initData?: string;
  refreshProfile?: () => Promise<unknown>;
};

export function useChallenges({ initData, refreshProfile }: UseChallengesOptions) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [challengeAction, setChallengeAction] = useState<string | null>(null);
  const [challengeMessage, setChallengeMessage] = useState('');

  const loadChallenges = async () => {
    if (!initData) return;

    setChallengesLoading(true);
    try {
      setChallenges(await fetchChallenges(initData));
    } catch (err) {
      setChallengeMessage(err instanceof Error ? err.message : 'Не удалось загрузить челленджи.');
    } finally {
      setChallengesLoading(false);
    }
  };

  const challengeRequest = async (challengeId: string, action: 'join' | 'check') => {
    if (!initData) return;

    setChallengeAction(challengeId);
    setChallengeMessage('');
    try {
      setChallenges(await updateChallenge(initData, challengeId, action));
      setChallengeMessage(action === 'join' ? 'Ты участвуешь в челлендже.' : 'День засчитан.');
      if (action === 'check') {
        await refreshProfile?.();
      }
    } catch (err) {
      setChallengeMessage(err instanceof Error ? err.message : 'Не удалось обновить челлендж.');
    } finally {
      setChallengeAction(null);
    }
  };

  return {
    challenges,
    challengesLoading,
    challengeAction,
    challengeMessage,
    loadChallenges,
    challengeRequest,
  };
}
