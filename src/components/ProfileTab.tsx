'use client';

import { Check, ChevronRight, Copy, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { UserData } from '@/hooks/useUserData';

type ProfileTabProps = { user: UserData | null; telegramId: string; firstName: string; onSaveWallet: (walletAddress: string) => Promise<void> };

export function ProfileTab({ user: account, telegramId, firstName, onSaveWallet }: ProfileTabProps) {
  const [walletAddress, setWalletAddress] = useState(account?.wallet_address ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setWalletAddress(account?.wallet_address ?? ''); }, [account?.wallet_address]);
  async function saveWallet() { setSaving(true); setSaved(false); try { await onSaveWallet(walletAddress); setSaved(true); } finally { setSaving(false); } }
  const balance = account ? account.balance.toFixed(2) : 'Loading';
  return <section className="tab-content"><div className="profile-head"><div className="avatar">{firstName[0] || 'A'}</div><div><span className="eyebrow">ACCOUNT</span><h1>{firstName}</h1><p><span className="verified-dot" /> Unverified account</p></div><button className="icon-button" aria-label="Copy Telegram ID" onClick={() => void navigator.clipboard?.writeText(telegramId)}><Copy size={17} /></button></div><div className="profile-card"><div className="profile-line"><span>Telegram User ID</span><strong>{telegramId}</strong></div><div className="profile-line"><span>Verification</span><strong className="warning-text">Unverified <ChevronRight size={16} /></strong></div></div><span className="eyebrow section-label">ASSETS BREAKDOWN</span><div className="assets-card"><div><span>Total assets</span><strong>{balance} <small>AGENB</small></strong></div><div><span>Holding wallet</span><strong>{balance} <small>AGENB</small></strong></div></div><span className="eyebrow section-label">WALLET &amp; WITHDRAWAL</span><div className="wallet-settings"><div className="wallet-block"><div className="wallet-block-title"><span className="setting-icon"><WalletCards size={18} /></span><span><strong>Connect Wallet</strong><small>Save your TON or crypto wallet address</small></span></div><input value={walletAddress} onChange={(event) => setWalletAddress(event.target.value)} placeholder="Enter wallet address" aria-label="Wallet address" /><button className="primary-button wallet-save" onClick={() => void saveWallet()} disabled={saving || !walletAddress.trim()}>{saved ? <><Check size={16} /> Saved</> : saving ? 'Saving...' : 'Save wallet'}</button>{account?.wallet_address && <small className="saved-address">Saved: {account.wallet_address}</small>}</div><div className="withdraw-block"><div><strong>Withdraw AGENB</strong><small>Send your balance to your connected wallet</small></div><span className="soon-badge">Soon / قريباً</span></div></div><div className="verified-note"><Check size={17} /><span>Your balance and wallet settings are stored securely in your account.</span></div></section>;
}
