'use client';

import confetti from 'canvas-confetti';
import { BarChart3, CircleUserRound, Gem, Home, ListChecks, Pickaxe, TimerReset, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { initData, useSignal } from '@tma.js/sdk-react';
import { getUnclaimedEarnings, DEFAULT_TELEGRAM_ID, type UserRecord } from '@/lib/mining';
import { useAdLimit } from '@/hooks/useAdLimit';
import { AdModal } from './AdModal';
import { FriendsTab } from './FriendsTab';
import { MineTab } from './MineTab';
import { MinersTab } from './MinersTab';
import { ProfileTab } from './ProfileTab';
import { TasksTab } from './TasksTab';
import './mining-app.css';

type Tab = 'mine' | 'tasks' | 'miners' | 'friends' | 'profile';
const tabs: { id: Tab; label: string; icon: typeof Home }[] = [{ id: 'mine', label: 'Mine', icon: Home }, { id: 'tasks', label: 'Tasks', icon: ListChecks }, { id: 'miners', label: 'Miners', icon: Pickaxe }, { id: 'friends', label: 'Friends', icon: Gem }, { id: 'profile', label: 'Profile', icon: CircleUserRound }];
function formatCountdown(ms: number) { const total = Math.ceil(ms / 1000); return `${String(Math.floor(total / 3600)).padStart(2, '0')}:${String(Math.floor((total % 3600) / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`; }

export function MiningApp() {
  const [tab, setTab] = useState<Tab>('mine');
  const [adOpen, setAdOpen] = useState(false);
  const telegramUser = useSignal(initData.user);
  const [user, setUser] = useState<UserRecord | null>(null);
  const [now, setNow] = useState(Date.now());
  const [claiming, setClaiming] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [savingWallet, setSavingWallet] = useState(false);
  const [error, setError] = useState('');
  const ads = useAdLimit();
  const telegramId = telegramUser?.id ? String(telegramUser.id) : DEFAULT_TELEGRAM_ID;
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/user?telegram_id=${encodeURIComponent(telegramId)}&username=${encodeURIComponent(telegramUser?.username || '')}`)
      .then(async (response) => { if (!response.ok) throw new Error('Unable to load account'); return response.json(); })
      .then((payload: { user: UserRecord }) => { if (!cancelled) setUser(payload.user); })
      .catch(() => { if (!cancelled) setError('Connect your database to load your account.'); });
    return () => { cancelled = true; };
  }, [telegramId, telegramUser?.username]);
  const requestUpdate = async (body: Record<string, unknown>) => {
    const response = await fetch('/api/user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ telegramId, username: telegramUser?.username, ...body }) });
    const payload = await response.json() as { user?: UserRecord; error?: string };
    if (!response.ok || !payload.user) throw new Error(payload.error || 'Request failed');
    setUser(payload.user);
  };
  const claim = async () => { setClaiming(true); setError(''); try { await requestUpdate({ action: 'claim' }); confetti({ particleCount: 90, spread: 65, origin: { y: 0.7 }, colors: ['#c5ff47', '#ffffff', '#63d8ff'] }); } catch { setError('Unable to claim mining earnings.'); } finally { setClaiming(false); } };
  const upgrade = async (level: number) => { setUpgrading(true); setError(''); try { await requestUpdate({ action: 'upgrade', targetLevel: level }); } catch { setError('Upgrade unavailable. Check your AGENB balance.'); } finally { setUpgrading(false); } };
  const saveWallet = async (walletAddress: string) => { setSavingWallet(true); setError(''); try { await requestUpdate({ action: 'wallet', walletAddress }); } catch { setError('Unable to save wallet address.'); } finally { setSavingWallet(false); } };
  const startAd = () => { if (ads.canWatch) setAdOpen(true); };
  const completeAd = () => { if (ads.recordWatch()) { setAdOpen(false); confetti({ particleCount: 90, spread: 65, origin: { y: 0.7 }, colors: ['#c5ff47', '#ffffff', '#63d8ff'] }); } };
  const unclaimed = user ? getUnclaimedEarnings(user.lastClaimTime, user.miningLevel, now) : 0;
  const renderTab = () => { const props = { onWatch: startAd, canWatch: ads.canWatch }; if (tab === 'tasks') return <TasksTab {...props} />; if (tab === 'miners') return <MinersTab {...props} user={user} onUpgrade={upgrade} upgrading={upgrading} />; if (tab === 'friends') return <FriendsTab />; if (tab === 'profile') return <ProfileTab user={user} onSaveWallet={saveWallet} savingWallet={savingWallet} />; return <MineTab {...props} user={user} unclaimed={unclaimed} onClaim={claim} claiming={claiming} />; };
  return <main className="mining-shell"><header className="app-header"><div className="brand"><span className="brand-mark"><BarChart3 size={17} /></span><span>AGENB<span>MINER</span></span></div><div className="header-wallet"><span className="wallet-dot" /> <span>{(user?.balance ?? 0).toLocaleString()} AGENB</span></div></header><div className="app-scroll">{error && <div className="error-banner">{error}</div>}{ads.watched >= ads.limit && <div className="limit-banner"><TimerReset size={16} /><span><strong>24h Limit Reached</strong><small>Next reset in {formatCountdown(ads.remainingMs)}</small></span></div>}{renderTab()}</div><button className="floating-boost" onClick={startAd} disabled={!ads.canWatch} aria-label="Watch boost ad"><Zap size={23} fill="currentColor" /><span>{ads.canWatch ? 'BOOST' : 'LIMIT'}</span></button><nav className="bottom-nav">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? 'selected' : ''} onClick={() => setTab(id)}><Icon size={19} /><span>{label}</span></button>)}</nav><AdModal open={adOpen} onClose={() => setAdOpen(false)} onComplete={completeAd} /></main>;
}
