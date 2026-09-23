'use client';

import { ArrowUpRight, Coins, Flame, Play, Zap } from 'lucide-react';
import type { ReactNode } from 'react';

type MineTabProps = { onWatch: () => void; canWatch: boolean };
const statItems: { label: string; value: string; icon: ReactNode }[] = [{ label: 'Total Balance', value: '12,480.00 ATF', icon: <Coins size={16} /> }, { label: 'Daily Earnings', value: '+286.40 ATF', icon: <Flame size={16} /> }, { label: 'Hash Rate', value: '4.82 TH/s', icon: <Zap size={16} /> }];

export function MineTab({ onWatch, canWatch }: MineTabProps) {
  return <section className="tab-content"><div className="hero-copy"><span className="eyebrow">ATF MINING NETWORK</span><h1>Make your balance<br /><em>work harder.</em></h1><p>Keep your rigs online, stack ATF, and grow your network.</p></div><div className="balance-card"><div><span className="muted-label">AVAILABLE BALANCE</span><strong>12,480<span>.00</span></strong><small>ATF <b>+4.8%</b> this week</small></div><div className="balance-orb"><Zap size={28} /></div></div><div className="stats-grid">{statItems.map((item) => <div className="stat-card" key={item.label}><span className="stat-icon">{item.icon}</span><span className="muted-label">{item.label}</span><strong>{item.value}</strong></div>)}</div><div className="section-heading"><div><span className="eyebrow">QUICK ACTION</span><h2>Boost your output</h2></div><ArrowUpRight size={20} /></div><div className="boost-panel"><div className="boost-icon"><Play size={20} fill="currentColor" /></div><div><strong>Watch & earn</strong><span>Get +100 ATF for every reward ad</span></div><button className="primary-button" onClick={onWatch} disabled={!canWatch}><Play size={15} fill="currentColor" /> Watch ad</button></div></section>;
}
