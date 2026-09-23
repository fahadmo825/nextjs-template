'use client';

import { CheckCircle2, Play, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type AdModalProps = { open: boolean; onClose: () => void; onComplete: () => void };

export function AdModal({ open, onClose, onComplete }: AdModalProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!open) { setReady(false); return; }
    const timer = window.setTimeout(() => setReady(true), 1400);
    return () => window.clearTimeout(timer);
  }, [open]);
  if (!open) return null;
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Reward ad"><div className="ad-modal"><button className="icon-button modal-close" onClick={onClose} aria-label="Close ad"><X size={18} /></button><div className="ad-screen"><div className="ad-play"><Play size={25} fill="currentColor" /></div><span>SPONSORED REWARD</span><strong>Stay for the reward</strong><small>Your boost will be credited when the clip ends.</small></div><button className="primary-button full-width" disabled={!ready} onClick={onComplete}>{ready ? <><CheckCircle2 size={17} /> Claim +100 ATF</> : 'Watching...'}</button></div></div>;
}
