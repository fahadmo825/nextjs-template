'use client';

import confetti from 'canvas-confetti';
import { BarChart3, CircleUserRound, Gem, Home, ListChecks, Pickaxe, TimerReset, Zap } from 'lucide-react';
import { useState } from 'react';
import { useAdLimit } from '@/hooks/useAdLimit';
import { useUserData } from '@/hooks/useUserData';
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
  const [actionError, setActionError] = useState<string | null>(null);
  const ads = useAdLimit();
  const account = useUserData();
  const startAd = () => { if (ads.canWatch) setAdOpen(true); };
  const completeAd = () => { if (ads.recordWatch()) { setAdOpen(false); confetti({ particleCount: 90, spread: 65, origin: { y: 0.7 }, colors: ['#c5ff47', '#ffffff', '#63d8ff'] }); } };
  async function runAction(action: () => Promise<void>) { setActionError(null); try { await action(); } catch (error) { setActionError(error instanceof Error ? error.message : 'Request failed'); } }
  const renderTab = () => { const props = { onWatch: startAd, canWatch: ads.canWatch }; if (tab === 'tasks') return <TasksTab {...props} />; if (tab === 'miners') return <MinersTab {...props} user={account.user} onUpgrade={(level) => runAction(() => account.upgrade(level))} />; if (tab === 'friends') return <FriendsTab />; if (tab === 'profile') return <ProfileTab user={account.user} onSaveWallet={(address) => runAction(() => account.saveWallet(address))} />; return <MineTab {...props} user={account.user} pendingEarnings={account.pendingEarnings} speedPerHour={account.level.speedPerHour} loading={account.loading} onClaim={() => runAction(account.claim)} />; };
  return <main className="mining-shell"><header className="app-header"><div className="brand"><span className="brand-mark"><BarChart3 size={17} /></span><span>AGENB<span>MINER</span></span></div><div className="header-wallet"><span className="wallet-dot" /> <span>{(account.user?.balance ?? 0).toFixed(2)} AGENB</span></div></header><div className="app-scroll">{account.error && <div className="limit-banner error-banner"><span><strong>Account unavailable</strong><small>{account.error}</small></span></div>}{actionError && <div className="limit-banner error-banner"><span><strong>Action failed</strong><small>{actionError}</small></span></div>}{ads.watched >= ads.limit && <div className="limit-banner"><TimerReset size={16} /><span><strong>24h Limit Reached</strong><small>Next reset in {formatCountdown(ads.remainingMs)}</small></span></div>}{renderTab()}</div><button className="floating-boost" onClick={startAd} disabled={!ads.canWatch} aria-label="Watch boost ad"><Zap size={23} fill="currentColor" /><span>{ads.canWatch ? 'BOOST' : 'LIMIT'}</span></button><nav className="bottom-nav">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? 'selected' : ''} onClick={() => setTab(id)}><Icon size={19} /><span>{label}</span></button>)}</nav><AdModal open={adOpen} onClose={() => setAdOpen(false)} onComplete={completeAd} /></main>;
}
