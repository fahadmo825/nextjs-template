'use client';

import { ArrowUpRight, Coins, Flame, Play, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import type { UserData } from '@/hooks/useUserData';

type MineTabProps = { onWatch: () => void; canWatch: boolean; user: UserData | null; pendingEarnings: number; speedPerHour: number; loading: boolean; onClaim: () => Promise<void> };

function formatAmount(value: number) { return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }); }

export function MineTab({ onWatch, canWatch, user, pendingEarnings, speedPerHour, loading, onClaim }: MineTabProps) {
  const statItems: { label: string; value: string; icon: ReactNode }[] = [{ label: 'Mining level', value: `Level ${user?.miningLevel ?? 1}`, icon: <Coins size={16} /> }, { label: 'Hourly speed', value: `${speedPerHour} AGENB`, icon: <Flame size={16} /> }, { label: 'Wallet status', value: user?.wallet_address ? 'Connected' : 'Not connected', icon: <Zap size={16} /> }];
  return <section className="tab-content"><div className="hero-copy"><span className="eyebrow">AGENB MINING NETWORK</span><h1>Make your balance<br /><em>work harder.</em></h1><p>Keep your miner online, stack AGENB, and grow your network.</p></div><div className="balance-card"><div><span className="muted-label">MAIN BALANCE</span><strong>{loading ? 'Loading' : formatAmount(user?.balance ?? 0)}<span> AGENB</span></strong><small>Level {user?.miningLevel ?? 1} · {speedPerHour} AGENB per hour</small></div><div className="balance-orb"><Zap size={28} /></div></div><div className="pending-card"><div><span className="muted-label">UNCLAIMED MINING EARNINGS</span><strong>+{formatAmount(pendingEarnings)} <small>AGENB</small></strong><span>Accumulating in real time at {speedPerHour} AGENB/hour</span></div><button className="claim-button claim-primary" onClick={() => void onClaim()} disabled={loading || pendingEarnings <= 0}>CLAIM</button></div><div className="stats-grid">{statItems.map((item) => <div className="stat-card" key={item.label}><span className="stat-icon">{item.icon}</span><span className="muted-label">{item.label}</span><strong>{item.value}</strong></div>)}</div><div className="section-heading"><div><span className="eyebrow">QUICK ACTION</span><h2>Boost your output</h2></div><ArrowUpRight size={20} /></div><div className="boost-panel"><div className="boost-icon"><Play size={20} fill="currentColor" /></div><div><strong>Watch & earn</strong><span>Get +100 AGENB for every reward ad</span></div><button className="primary-button" onClick={onWatch} disabled={!canWatch}><Play size={15} fill="currentColor" /> Watch ad</button></div></section>;
}
