import { useEffect, useRef, useState } from 'react';

import { fetchTrainings } from '../api/client';
import type { Training } from '../types';

type TelegramWebApp = {
  initData?: string;
  ready?: () => void;
  expand?: () => void;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
};

type UseAppBootstrapResult = {
  initData: string;
  trainings: Training[];
  loading: boolean;
  error: string;
};

export function useAppBootstrap(loadProfile: (initData: string) => Promise<unknown>): UseAppBootstrapResult {
  const [initData, setInitData] = useState('');
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const loadProfileRef = useRef(loadProfile);

  useEffect(() => {
    loadProfileRef.current = loadProfile;
  }, [loadProfile]);

  useEffect(() => {
    const init = async () => {
      const tg = (window as TelegramWindow).Telegram?.WebApp;

      try {
        tg?.ready?.();
        tg?.expand?.();

        if (!tg) {
          setError('\u041e\u0442\u043a\u0440\u043e\u0439 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u0435 \u0432\u043d\u0443\u0442\u0440\u0438 Telegram.');
          return;
        }

        if (!tg.initData) {
          setError('Telegram \u043d\u0435 \u043f\u0435\u0440\u0435\u0434\u0430\u043b \u0434\u0430\u043d\u043d\u044b\u0435 \u0430\u0432\u0442\u043e\u0440\u0438\u0437\u0430\u0446\u0438\u0438.');
          return;
        }

        setInitData(tg.initData);
        await loadProfileRef.current(tg.initData);
        setTrainings(await fetchTrainings());
      } catch (err) {
        setError(err instanceof Error ? err.message : '\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u043e\u0435\u0434\u0438\u043d\u0435\u043d\u0438\u044f.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  return {
    initData,
    trainings,
    loading,
    error,
  };
}
