import { NextResponse } from 'next/server';
import { calculatePendingEarnings, getMiningLevel, type MiningLevel } from '@/lib/mining';
import { ensureUsersTable, sql } from '@/lib/db';
import { isTelegramRequestAuthorized } from '@/lib/telegram-auth';

export const dynamic = 'force-dynamic';

type UserPayload = { telegramId?: string; telegram_id?: string; username?: string | null; start_param?: string | null };
type UserRow = { telegram_id: string; username: string | null; referral_count: number; balance: string | number; mining_level: number; last_claim_time: string | number; wallet_address: string; created_at: string };

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function validateTelegramId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9A-Za-z:_-]{1,128}$/.test(value);
}

async function getOrCreateUser(telegramId: string, username: string | null = null) {
  const now = Date.now();
  const rows = await sql`
    INSERT INTO users (telegram_id, username, mining_level, last_claim_time)
    VALUES (${telegramId}, ${username}, 1, ${now})
    ON CONFLICT (telegram_id) DO UPDATE SET username = COALESCE(EXCLUDED.username, users.username)
    RETURNING telegram_id, username, referral_count, balance::text, mining_level, last_claim_time, wallet_address, created_at
  `;
  return rows[0] as UserRow;
}

function serializeUser(row: UserRow, now = Date.now()) {
  const balance = Number(row.balance);
  const miningLevel = Number(row.mining_level);
  const lastClaimTime = Number(row.last_claim_time);
  return {
    ...row,
    balance,
    miningLevel,
    lastClaimTime,
    pendingEarnings: calculatePendingEarnings(lastClaimTime, miningLevel, now),
  };
}

function getRequestTelegramId(request: Request) {
  return new URL(request.url).searchParams.get('telegram_id');
}

export async function GET(request: Request) {
  const telegramId = getRequestTelegramId(request);
  if (!validateTelegramId(telegramId)) return errorResponse('A valid telegram_id is required');
  if (!isTelegramRequestAuthorized(request.headers.get('x-telegram-init-data'), telegramId)) return errorResponse('Telegram authentication failed', 401);

  try {
    await ensureUsersTable();
    const username = new URL(request.url).searchParams.get('username');
    const row = await getOrCreateUser(telegramId, username);
    const user = serializeUser(row);
    return NextResponse.json({ user, level: getMiningLevel(user.miningLevel) });
  } catch (error) {
    console.error('Failed to load user', error);
    return errorResponse('Unable to load user data', 500);
  }
}

export async function POST(request: Request) {
  let body: UserPayload & { action?: 'claim' | 'wallet' | 'upgrade'; walletAddress?: string; level?: MiningLevel };
  try { body = await request.json(); } catch { return errorResponse('Invalid JSON body'); }

  const telegramId = body.telegramId ?? body.telegram_id;
  if (!validateTelegramId(telegramId)) return errorResponse('A valid telegramId is required');
  if (!isTelegramRequestAuthorized(request.headers.get('x-telegram-init-data'), telegramId)) return errorResponse('Telegram authentication failed', 401);

  try {
    await ensureUsersTable();
    const existingUser = await getOrCreateUser(telegramId, body.username ?? null);

    if (!body.action) {
      const user = serializeUser(existingUser);
      return NextResponse.json({ user, level: getMiningLevel(user.miningLevel) });
    }

    if (body.action === 'wallet') {
      if (typeof body.walletAddress !== 'string' || body.walletAddress.length > 255) return errorResponse('Invalid wallet address');
      const rows = await sql`UPDATE users SET wallet_address = ${body.walletAddress.trim()} WHERE telegram_id = ${telegramId} RETURNING wallet_address`;
      return NextResponse.json({ walletAddress: rows[0].wallet_address });
    }

    if (body.action === 'upgrade') {
      const requestedLevel = body.level;
      if (typeof requestedLevel !== 'number' || !Number.isInteger(requestedLevel) || requestedLevel < 2 || requestedLevel > 12) return errorResponse('Invalid mining level');
      const target = getMiningLevel(requestedLevel);
      const rows = await sql`
        UPDATE users SET balance = balance - ${target.upgradeCost}, mining_level = ${requestedLevel}
        WHERE telegram_id = ${telegramId} AND mining_level = ${requestedLevel - 1} AND balance >= ${target.upgradeCost}
        RETURNING balance::text, mining_level
      `;
      if (!rows.length) return errorResponse('Insufficient balance or invalid upgrade', 409);
      return NextResponse.json({ balance: Number(rows[0].balance), miningLevel: Number(rows[0].mining_level) });
    }

    if (body.action !== 'claim') return errorResponse('Unsupported action');
    const now = Date.now();
    const rows = await sql`
      UPDATE users
      SET balance = balance + (((${now}::BIGINT - last_claim_time)::NUMERIC / 3600000) * CASE mining_level WHEN 1 THEN 5 WHEN 2 THEN 5 WHEN 3 THEN 5 WHEN 4 THEN 5 WHEN 5 THEN 5 WHEN 6 THEN 5 WHEN 7 THEN 5.5 WHEN 8 THEN 5.5 WHEN 9 THEN 5.5 WHEN 10 THEN 5.5 WHEN 11 THEN 5.5 WHEN 12 THEN 6 ELSE 5 END), last_claim_time = ${now}
      WHERE telegram_id = ${telegramId}
      RETURNING telegram_id, username, referral_count, balance::text, mining_level, last_claim_time, wallet_address, created_at
    `;
    if (!rows.length) return errorResponse('User not found', 404);
    const user = serializeUser(rows[0] as UserRow, now);
    return NextResponse.json({ user: { ...user, pendingEarnings: 0 }, balance: user.balance, miningLevel: user.miningLevel, lastClaimTime: user.lastClaimTime, pendingEarnings: 0 });
  } catch (error) {
    console.error('Failed to update user', error);
    return errorResponse('Unable to update user data', 500);
  }
}
