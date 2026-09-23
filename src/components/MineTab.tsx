'use client';

import { ArrowUpRight, Coins, Flame, Play, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import type { UserRecord } from '@/lib/mining';

type MineTabProps = { user: UserRecord | null; unclaimed: number; onClaim: () => void; claiming: boolean; onWatch: () => void; canWatch: boolean };
const formatAmount = (amount: number) => amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function MineTab({ user, unclaimed, onClaim, claiming, onWatch, canWatch }: MineTabProps) {
  const balance = user?.balance ?? 0;
  const rate = user ? [10, 25, 60, 150, 400][user.miningLevel - 1] ?? 10 : 10;
  const statItems: { label: string; value: string; icon: ReactNode }[] = [
    { label: 'Main Balance', value: `${formatAmount(balance)} AGENB`, icon: <Coins size={16} /> },
    { label: 'Mining Rate', value: `${rate} AGENB/hour`, icon: <Flame size={16} /> },
    { label: 'Current Level', value: `Level ${user?.miningLevel ?? 1}`, icon: <Zap size={16} /> },
  ];

  return <section className="tab-content"><div className="hero-copy"><span className="eyebrow">AGENB MINING NETWORK</span><h1>Make your balance<br /><em>work harder.</em></h1><p>Keep your rig online, stack AGENB, and grow your network.</p></div><div className="balance-card"><div><span className="muted-label">MAIN BALANCE</span><strong>{formatAmount(balance).split('.')[0]}<span>.{formatAmount(balance).split('.')[1]}</span></strong><small>AGENB <b>LIVE MINING</b></small></div><div className="balance-orb"><Zap size={28} /></div></div><div className="unclaimed-card"><div><span className="muted-label">UNCLAIMED MINING EARNINGS</span><strong>+{formatAmount(unclaimed)} <small>AGENB</small></strong><span>Accumulating at {rate} AGENB/hour</span></div><button className="claim-button claim-primary" disabled={claiming || unclaimed <= 0} onClick={onClaim}>{claiming ? 'CLAIMING...' : 'CLAIM'}</button></div><div className="stats-grid">{statItems.map((item) => <div className="stat-card" key={item.label}><span className="stat-icon">{item.icon}</span><span className="muted-label">{item.label}</span><strong>{item.value}</strong></div>)}</div><div className="section-heading"><div><span className="eyebrow">QUICK ACTION</span><h2>Boost your output</h2></div><ArrowUpRight size={20} /></div><div className="boost-panel"><div className="boost-icon"><Play size={20} fill="currentColor" /></div><div><strong>Watch & earn</strong><span>Get +100 AGENB for every reward ad</span></div><button className="primary-button" onClick={onWatch} disabled={!canWatch}><Play size={15} fill="currentColor" /> Watch ad</button></div></section>;
}
