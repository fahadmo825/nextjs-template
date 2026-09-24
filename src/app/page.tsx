'use client';

import { useEffect } from 'react';
import { MiningApp } from '@/components/MiningApp';

type TelegramWebAppWindow = Window & { Telegram?: { WebApp?: { ready: () => void; expand: () => void } } };

export default function Home() {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as TelegramWebAppWindow).Telegram?.WebApp) {
      const webApp = (window as TelegramWebAppWindow).Telegram!.WebApp!;
      webApp.ready();
      webApp.expand();
    }
  }, []);

  return <MiningApp />;
}
