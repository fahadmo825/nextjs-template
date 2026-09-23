'use client';

import { useCallback, useEffect, useState } from 'react';

const ADS_WATCHED_KEY = 'ads_watched_today';
const FIRST_WATCH_KEY = 'ad_first_watch_timestamp';
const DAY_MS = 24 * 60 * 60 * 1000;
export const DAILY_AD_LIMIT = 10;

export function useAdLimit() {
  const [watched, setWatched] = useState(0);
  const [firstWatch, setFirstWatch] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const resetIfExpired = useCallback(() => {
    const storedFirstWatch = Number(localStorage.getItem(FIRST_WATCH_KEY) || 0);
    if (storedFirstWatch && Date.now() - storedFirstWatch >= DAY_MS) {
      localStorage.setItem(ADS_WATCHED_KEY, '0');
      localStorage.removeItem(FIRST_WATCH_KEY);
      setWatched(0);
      setFirstWatch(null);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const storedFirstWatch = Number(localStorage.getItem(FIRST_WATCH_KEY) || 0);
    const expired = storedFirstWatch > 0 && Date.now() - storedFirstWatch >= DAY_MS;
    if (expired) {
      localStorage.setItem(ADS_WATCHED_KEY, '0');
      localStorage.removeItem(FIRST_WATCH_KEY);
    } else {
      setWatched(Number(localStorage.getItem(ADS_WATCHED_KEY) || 0));
      setFirstWatch(storedFirstWatch || null);
    }
    const interval = window.setInterval(() => {
      resetIfExpired();
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [resetIfExpired]);

  const canWatch = watched < DAILY_AD_LIMIT;
  const remainingMs = firstWatch ? Math.max(0, firstWatch + DAY_MS - now) : 0;

  const recordWatch = useCallback(() => {
    if (!canWatch) return false;
    const timestamp = firstWatch || Date.now();
    const nextCount = watched + 1;
    localStorage.setItem(ADS_WATCHED_KEY, String(nextCount));
    localStorage.setItem(FIRST_WATCH_KEY, String(timestamp));
    setWatched(nextCount);
    setFirstWatch(timestamp);
    return true;
  }, [canWatch, firstWatch, watched]);

  return { watched, remainingMs, canWatch, recordWatch, limit: DAILY_AD_LIMIT };
}
