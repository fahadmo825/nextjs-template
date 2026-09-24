import { NextResponse } from 'next/server';
import { getMiningLevel } from '@/lib/mining';
import { ensureUsersTable, sql } from '@/lib/db';
import { isTelegramRequestAuthorized } from '@/lib/telegram-auth';

export const dynamic = 'force-dynamic';

type ClaimRow = { telegram_id: string; username: string | null; referral_count: number; balance: string | number; mining_level: number; last_claim_time: string | number; wallet_address: string; created_at: string };

function validId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9A-Za-z:_-]{1,128}$/.test(value);
}

export async function POST(request: Request) {
  let body: { telegram_id?: string; telegramId?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const telegramId = body.telegram_id ?? body.telegramId;
  if (!validId(telegramId)) return NextResponse.json({ error: 'A valid telegram_id is required' }, { status: 400 });
  if (!isTelegramRequestAuthorized(request.headers.get('x-telegram-init-data'), telegramId)) return NextResponse.json({ error: 'Telegram authentication failed' }, { status: 401 });

  try {
    await ensureUsersTable();
    const now = Date.now();
    const rows = await sql`
      UPDATE users
      SET balance = balance + (((${now}::BIGINT - last_claim_time)::NUMERIC / 3600000) * CASE mining_level WHEN 1 THEN 5 WHEN 2 THEN 5 WHEN 3 THEN 5 WHEN 4 THEN 5 WHEN 5 THEN 5 WHEN 6 THEN 5 WHEN 7 THEN 5.5 WHEN 8 THEN 5.5 WHEN 9 THEN 5.5 WHEN 10 THEN 5.5 WHEN 11 THEN 5.5 WHEN 12 THEN 6 ELSE 5 END), last_claim_time = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
      WHERE telegram_id = ${telegramId}
      RETURNING telegram_id, username, referral_count, balance::text, mining_level, last_claim_time, wallet_address, created_at
    `;
    if (!rows.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const row = rows[0] as ClaimRow;
    const user = { ...row, balance: Number(row.balance), miningLevel: Number(row.mining_level), lastClaimTime: Number(row.last_claim_time) || now, pendingEarnings: 0, level: getMiningLevel(Number(row.mining_level)) };
    return NextResponse.json({ user, balance: user.balance, miningLevel: user.miningLevel, lastClaimTime: user.lastClaimTime, pendingEarnings: 0 });
  } catch (error) {
    console.error('Failed to claim user earnings', error);
    return NextResponse.json({ error: 'Unable to claim earnings' }, { status: 500 });
  }
}