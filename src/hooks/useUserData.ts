'use client';

import { useRawInitData } from '@tma.js/sdk-react';
import { createContext, createElement, type PropsWithChildren, useContext, useEffect, useState } from 'react';
import { calculatePendingEarnings, getMiningLevel, type MiningLevel } from '@/lib/mining';

export type TelegramUser = { id: number; first_name: string; username?: string };
type TelegramWebApp = { initData?: string; initDataUnsafe?: { start_param?: string; user?: TelegramUser }; ready?: () => void; expand?: () => void };
export type TelegramIdentity = { user: TelegramUser | null; telegramId: string; username: string | null; firstName: string; startParam: string | null; initData: string };
const LOCAL_TEST_ID = 'local-preview';
const TelegramIdentityContext = createContext<TelegramIdentity | null>(null);

export function TelegramIdentityProvider({ children }: PropsWithChildren) {
  const [identity, setIdentity] = useState<TelegramIdentity | null>(null);
  useEffect(() => {
    const webApp = (window as Window & { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
    webApp?.ready?.();
    webApp?.expand?.();
    const user = webApp?.initDataUnsafe?.user ?? null;
    setIdentity({ user, telegramId: user?.id ? String(user.id) : LOCAL_TEST_ID, username: user?.username ?? null, firstName: user?.first_name ?? 'Local preview', startParam: webApp?.initDataUnsafe?.start_param ?? null, initData: webApp?.initData ?? '' });
  }, []);
  return createElement(TelegramIdentityContext.Provider, { value: identity }, children);
}

export function useTelegramIdentity() { return useContext(TelegramIdentityContext); }

export type UserData = {
  telegram_id: string;
  username: string | null;
  first_name?: string | null;
  referral_count: number;
  balance: number;
  miningLevel: number;
  lastClaimTime: number;
  wallet_address: string;
  created_at: string;
  pendingEarnings: number;
};

type ApiResponse = { user: UserData };
type PostResponse = ApiResponse & { error?: string; balance?: number; miningLevel?: number; lastClaimTime?: number; pendingEarnings?: number; walletAddress?: string };

export function useUserData() {
  const sdkRawInitData = useRawInitData();
  const identity = useTelegramIdentity();
  const [user, setUser] = useState<UserData | null>(null);
  const [unclaimedLive, setUnclaimedLive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const telegramUser = identity?.user;
  const rawInitData = sdkRawInitData || identity?.initData || '';
  const telegramId = identity?.telegramId ?? '';

  async function loadUser() {
    setLoading(true);
    try {
      const headers: HeadersInit = rawInitData ? { 'x-telegram-init-data': rawInitData } : {};
      const response = await fetch('/api/user', { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ telegram_id: telegramId, username: identity?.username, start_param: identity?.startParam }) });
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

  useEffect(() => { void loadUser(); }, [telegramId, identity?.username, identity?.startParam, rawInitData]);

  useEffect(() => {
    if (!user) return;
    const updateLiveEarnings = () => setUnclaimedLive(calculatePendingEarnings(user.lastClaimTime, user.miningLevel, Date.now()));
    updateLiveEarnings();
    const timer = window.setInterval(updateLiveEarnings, 1000);
    return () => window.clearInterval(timer);
  }, [user?.lastClaimTime, user?.miningLevel]);

  async function post(action: 'wallet' | 'upgrade', payload: Record<string, unknown> = {}) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (rawInitData) headers['x-telegram-init-data'] = rawInitData;
    const response = await fetch('/api/user', { method: 'POST', headers, body: JSON.stringify({ telegram_id: telegramId, action, ...payload }) });
    const data = await response.json() as PostResponse;
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  async function claim() {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (rawInitData) headers['x-telegram-init-data'] = rawInitData;
    const response = await fetch('/api/user', { method: 'POST', headers, body: JSON.stringify({ telegram_id: telegramId, action: 'claim' }) });
    const data = await response.json() as PostResponse;
    if (!response.ok) throw new Error(data.error || 'Request failed');
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

  return { user, telegramUser, telegramId, username: identity?.username ?? null, firstName: identity?.firstName ?? 'AGENB Miner', referralLink: `https://t.me/AURA_AGENBOT?start=${telegramId}`, loading, error, pendingEarnings: unclaimedLive, level: getMiningLevel(user?.miningLevel ?? 1), claim, saveWallet, upgrade, reload: loadUser };
}
