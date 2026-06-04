import { useEffect, useState } from 'react';
import { useLaunchParams } from '@telegram-apps/sdk-react';

function App() {
  const lp = useLaunchParams();
  const [userName, setUserName] = useState('друг');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    // Временно приводим к any, так как тип initDataRaw не содержит user
    const initData = lp?.initDataRaw as any;
    const user = initData?.user;
    if (user) {
      setUserName(user.firstName || 'друг');
      setUserId(String(user.id));
    }
  }, [lp]);

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>🍯 Fitness Pooh</h1>
      <p>Твой ID в Telegram: <strong>{userId || 'загрузка...'}</strong></p>
      <p>Привет, {userName}!</p>
      <hr />
      <div>
        <button
          style={{ padding: '10px 20px', marginRight: '10px', cursor: 'pointer' }}
          onClick={() => alert('Скоро здесь будут привычки!')}
        >
          ✅ Отметить привычки
        </button>
        <button
          style={{ padding: '10px 20px', cursor: 'pointer' }}
          onClick={() => alert('Профиль и статистика')}
        >
          📊 Мой профиль
        </button>
      </div>
    </div>
  );
}

export default App;