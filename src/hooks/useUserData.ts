'use client';

import { initData, useRawInitData, useSignal } from '@tma.js/sdk-react';
import { useEffect, useMemo, useState } from 'react';
import { calculatePendingEarnings, getMiningLevel, type MiningLevel } from '@/lib/mining';

export type UserData = {
  telegram_id: string;
  username: string | null;
  balance: number;
  miningLevel: number;
  lastClaimTime: number;
  wallet_address: string;
  created_at: string;
  pendingEarnings: number;
};

type ApiResponse = { user: UserData };

export function useUserData() {
  const telegramUser = useSignal(initData.user);
  const rawInitData = useRawInitData();
  const telegramId = String(telegramUser?.id ?? 'local-preview');
  const [user, setUser] = useState<UserData | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadUser() {
    setLoading(true);
    try {
      const query = new URLSearchParams({ telegram_id: telegramId });
      if (telegramUser?.username) query.set('username', telegramUser.username);
      const response = await fetch(`/api/user?${query}`, { cache: 'no-store', headers: rawInitData ? { 'x-telegram-init-data': rawInitData } : undefined });
      if (!response.ok) throw new Error('Unable to load account');
      const data = (await response.json()) as ApiResponse;
      setUser(data.user);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load account');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadUser(); }, [telegramId, telegramUser?.username, rawInitData]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const pendingEarnings = useMemo(
    () => user ? calculatePendingEarnings(user.lastClaimTime, user.miningLevel, now) : 0,
    [now, user],
  );

  async function post(action: 'claim' | 'wallet' | 'upgrade', payload: Record<string, unknown> = {}) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (rawInitData) headers['x-telegram-init-data'] = rawInitData;
    const response = await fetch('/api/user', { method: 'POST', headers, body: JSON.stringify({ telegramId, action, ...payload }) });
    const data = await response.json() as { error?: string; balance?: number; miningLevel?: number; lastClaimTime?: number; walletAddress?: string };
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  async function claim() {
    const data = await post('claim');
    setUser((current) => current ? { ...current, balance: data.balance ?? current.balance, lastClaimTime: data.lastClaimTime ?? Date.now(), pendingEarnings: 0 } : current);
  }

  async function saveWallet(walletAddress: string) {
    const data = await post('wallet', { walletAddress });
    setUser((current) => current ? { ...current, wallet_address: data.walletAddress ?? walletAddress } : current);
  }

  async function upgrade(level: MiningLevel) {
    const data = await post('upgrade', { level });
    setUser((current) => current ? { ...current, balance: data.balance ?? current.balance, miningLevel: data.miningLevel ?? level, lastClaimTime: Date.now() } : current);
  }

  return { user, telegramUser, loading, error, pendingEarnings, level: getMiningLevel(user?.miningLevel ?? 1), claim, saveWallet, upgrade, reload: loadUser };
}
