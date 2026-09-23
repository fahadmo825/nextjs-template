'use client';

import { Check, ChevronRight, Copy, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { initData, useSignal } from '@tma.js/sdk-react';

export function ProfileTab() {
  const user = useSignal(initData.user);
  const [muted, setMuted] = useState(false);
  const userId = user?.id ? String(user.id) : 'Local preview';
  return <section className="tab-content"><div className="profile-head"><div className="avatar">{user?.first_name?.[0] || 'A'}</div><div><span className="eyebrow">ACCOUNT</span><h1>{user?.first_name || 'ATF Miner'}</h1><p><span className="verified-dot" /> Unverified account</p></div><button className="icon-button"><Copy size={17} /></button></div><div className="profile-card"><div className="profile-line"><span>Telegram User ID</span><strong>{userId}</strong></div><div className="profile-line"><span>Verification</span><strong className="warning-text">Unverified <ChevronRight size={16} /></strong></div></div><span className="eyebrow section-label">ASSETS BREAKDOWN</span><div className="assets-card"><div><span>Total assets</span><strong>12,480.00 <small>ATF</small></strong></div><div><span>Holding wallet</span><strong>8,940.00 <small>ATF</small></strong></div><div><span>Pool wallet</span><strong>3,540.00 <small>ATF</small></strong></div></div><span className="eyebrow section-label">PREFERENCES</span><div className="settings-card"><button className="setting-row" onClick={() => setMuted(!muted)}><span className="setting-icon">{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</span><span><strong>Sound effects</strong><small>{muted ? 'Muted' : 'Unmute'}</small></span><span className={`toggle ${!muted ? 'on' : ''}`}><i /></span></button><div className="setting-row"><span className="setting-icon"><ShieldCheck size={18} /></span><span><strong>Security status</strong><small>Protect your account</small></span><ChevronRight size={17} /></div></div><div className="verified-note"><Check size={17} /><span>Verify your Telegram account to unlock higher limits.</span></div></section>;
}
