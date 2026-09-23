'use client';

import { initData, useRawInitData, useSignal } from '@tma.js/sdk-react';
import { useEffect, useState } from 'react';
import { getMiningLevel, type MiningLevel } from '@/lib/mining';

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

type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: { user?: { id?: number; username?: string } };
};

type ApiResponse = { user: UserData };
type PostResponse = ApiResponse & { error?: string; balance?: number; miningLevel?: number; lastClaimTime?: number; pendingEarnings?: number; walletAddress?: string };

export function useUserData() {
  const sdkTelegramUser = useSignal(initData.user);
  const sdkRawInitData = useRawInitData();
  const [webAppUser, setWebAppUser] = useState<{ id: number; username?: string } | null>(null);
  const [webAppInitData, setWebAppInitData] = useState('');
  const [user, setUser] = useState<UserData | null>(null);
  const [unclaimedLive, setUnclaimedLive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const webApp = (window as Window & { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
    const webAppTelegramUser = webApp?.initDataUnsafe?.user;
    if (webAppTelegramUser?.id) setWebAppUser({ id: webAppTelegramUser.id, username: webAppTelegramUser.username });
    if (webApp?.initData) setWebAppInitData(webApp.initData);
  }, []);

  const telegramUser = sdkTelegramUser ?? webAppUser;
  const rawInitData = sdkRawInitData || webAppInitData;
  const telegramId = String(telegramUser?.id ?? 'local-preview');

  async function loadUser() {
    setLoading(true);
    try {
      const query = new URLSearchParams({ telegram_id: telegramId });
      if (telegramUser?.username) query.set('username', telegramUser.username);
      const headers: HeadersInit = rawInitData ? { 'x-telegram-init-data': rawInitData } : {};
      const response = await fetch(`/api/user?${query}`, { cache: 'no-store', headers });
      if (!response.ok) throw new Error('Unable to load account');
      const data = await response.json() as ApiResponse;
      setUser(data.user);
      setUnclaimedLive(data.user.pendingEarnings);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load account');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadUser(); }, [telegramId, telegramUser?.username, rawInitData]);

  useEffect(() => {
    if (!user) return;
    const speedPerSecond = getMiningLevel(user.miningLevel).speedPerHour / 3600;
    const timer = window.setInterval(() => setUnclaimedLive((current) => current + speedPerSecond), 1000);
    return () => window.clearInterval(timer);
  }, [user?.miningLevel]);

  async function post(action: 'claim' | 'wallet' | 'upgrade', payload: Record<string, unknown> = {}) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (rawInitData) headers['x-telegram-init-data'] = rawInitData;
    const response = await fetch('/api/user', { method: 'POST', headers, body: JSON.stringify({ telegramId, action, ...payload }) });
    const data = await response.json() as PostResponse;
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  async function claim() {
    const data = await post('claim');
    if (data.user) setUser(data.user);
    else setUser((current) => current ? { ...current, balance: data.balance ?? current.balance, lastClaimTime: data.lastClaimTime ?? Date.now(), pendingEarnings: 0 } : current);
    setUnclaimedLive(0);
  }

  async function saveWallet(walletAddress: string) {
    const data = await post('wallet', { walletAddress });
    setUser((current) => current ? { ...current, wallet_address: data.walletAddress ?? walletAddress } : current);
  }

  async function upgrade(level: MiningLevel) {
    const data = await post('upgrade', { level });
    setUser((current) => current ? { ...current, balance: data.balance ?? current.balance, miningLevel: data.miningLevel ?? level, lastClaimTime: Date.now() } : current);
    setUnclaimedLive(0);
  }

  return { user, telegramUser, loading, error, pendingEarnings: unclaimedLive, level: getMiningLevel(user?.miningLevel ?? 1), claim, saveWallet, upgrade, reload: loadUser };
}
