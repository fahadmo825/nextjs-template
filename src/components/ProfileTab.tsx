'use client';

import { Check, Copy, Link2, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { initData, useSignal } from '@tma.js/sdk-react';
import type { UserRecord } from '@/lib/mining';

type ProfileTabProps = { user: UserRecord | null; onSaveWallet: (address: string) => Promise<void>; savingWallet: boolean };

export function ProfileTab({ user, onSaveWallet, savingWallet }: ProfileTabProps) {
  const telegramUser = useSignal(initData.user);
  const [wallet, setWallet] = useState(user?.walletAddress ?? '');
  const [saved, setSaved] = useState(false);
  useEffect(() => setWallet(user?.walletAddress ?? ''), [user?.walletAddress]);
  const userId = telegramUser?.id ? String(telegramUser.id) : user?.telegramId || 'Local preview';
  const saveWallet = async () => { await onSaveWallet(wallet); setSaved(true); window.setTimeout(() => setSaved(false), 1800); };
  return <section className="tab-content"><div className="profile-head"><div className="avatar">{telegramUser?.first_name?.[0] || 'A'}</div><div><span className="eyebrow">ACCOUNT</span><h1>{telegramUser?.first_name || user?.username || 'AGENB Miner'}</h1><p><span className="verified-dot" /> Unverified account</p></div><button className="icon-button" aria-label="Copy Telegram ID" onClick={() => navigator.clipboard?.writeText(userId)}><Copy size={17} /></button></div><div className="profile-card"><div className="profile-line"><span>Telegram User ID</span><strong>{userId}</strong></div><div className="profile-line"><span>Verification</span><strong className="warning-text">Unverified</strong></div></div><span className="eyebrow section-label">ASSETS BREAKDOWN</span><div className="assets-card"><div><span>Total assets</span><strong>{(user?.balance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} <small>AGENB</small></strong></div><div><span>Holding wallet</span><strong>{(user?.balance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} <small>AGENB</small></strong></div><div><span>Pool wallet</span><strong>0.00 <small>AGENB</small></strong></div></div><span className="eyebrow section-label">WALLET & WITHDRAWAL</span><div className="wallet-panel"><div className="wallet-panel-title"><WalletCards size={19} /><div><strong>Connect Wallet</strong><small>Save your TON or crypto wallet address</small></div></div><input value={wallet} onChange={(event) => setWallet(event.target.value)} placeholder="Enter wallet address" aria-label="Wallet address" /><button className="primary-button" disabled={savingWallet || !wallet.trim()} onClick={saveWallet}>{saved ? <><Check size={15} /> Saved</> : savingWallet ? 'SAVING...' : <><Link2 size={15} /> Save wallet</>}</button>{user?.walletAddress && <small className="saved-address">Saved: {user.walletAddress}</small>}</div><div className="withdraw-panel"><div><strong>Withdraw AGENB</strong><span>Withdrawals will be available soon.</span></div><span className="soon-badge">Soon / قريباً</span></div></section>;
}
