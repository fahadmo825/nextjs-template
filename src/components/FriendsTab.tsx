'use client';

import { Check, Copy, Gift, Users } from 'lucide-react';
import { useState } from 'react';

type FriendsTabProps = { telegramId: string; referralLink: string; referralCount: number };

export function FriendsTab({ telegramId, referralLink, referralCount }: FriendsTabProps) {
  const [copied, setCopied] = useState(false);
  async function copyLink() { await navigator.clipboard?.writeText(referralLink); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  const inviteDisplay = referralLink.replace('https://', '');
  return <section className="tab-content"><div className="page-heading"><span className="eyebrow">REFERRAL HUB</span><h1>Grow together</h1><p>Bring your crew in. Everyone earns more when the network grows.</p></div><div className="invite-card"><div className="invite-mark"><Users size={22} /></div><div><span className="muted-label">YOUR INVITE LINK</span><strong>{inviteDisplay}</strong><small className="invite-id">Telegram ID: {telegramId}</small></div><button className="icon-button copy-button" onClick={copyLink} aria-label="Copy invite link">{copied ? <Check size={18} /> : <Copy size={18} />}</button></div><div className="stats-grid referral-stats"><div className="stat-card"><span className="stat-icon"><Users size={16} /></span><span className="muted-label">Total referrals</span><strong>{referralCount}</strong></div><div className="stat-card"><span className="stat-icon"><Gift size={16} /></span><span className="muted-label">Referral rewards</span><strong>0 AGENB</strong></div><div className="stat-card"><span className="stat-icon"><span className="tiny-agenb">A</span></span><span className="muted-label">Team earnings</span><strong>0 AGENB</strong></div></div><div className="section-heading"><div><span className="eyebrow">YOUR NETWORK</span><h2>Team hierarchy</h2></div></div><div className="network-tree"><div className="tree-person root-person"><span>Y</span><div><strong>You</strong><small>Telegram ID: {telegramId}</small></div></div></div></section>;
}
