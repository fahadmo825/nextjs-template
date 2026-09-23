import { NextResponse } from 'next/server';
import { calculatePendingEarnings, getMiningLevel, type MiningLevel } from '@/lib/mining';
import { ensureUsersTable, sql } from '@/lib/db';
import { isTelegramRequestAuthorized } from '@/lib/telegram-auth';

export const dynamic = 'force-dynamic';

type UserPayload = { telegramId?: string; username?: string | null };

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function validateTelegramId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9A-Za-z:_-]{1,128}$/.test(value);
}

export async function GET(request: Request) {
  const telegramId = new URL(request.url).searchParams.get('telegram_id');
  if (!validateTelegramId(telegramId)) return errorResponse('A valid telegram_id is required');
  if (!isTelegramRequestAuthorized(request.headers.get('x-telegram-init-data'), telegramId)) return errorResponse('Telegram authentication failed', 401);
  try {
    await ensureUsersTable();
    const username = new URL(request.url).searchParams.get('username');
    const rows = await sql!`
      INSERT INTO users (telegram_id, username)
      VALUES (${telegramId}, ${username})
      ON CONFLICT (telegram_id) DO UPDATE SET username = COALESCE(EXCLUDED.username, users.username)
      RETURNING telegram_id, username, balance::text, mining_level, last_claim_time, wallet_address, created_at
    `;
    const user = rows[0];
    return NextResponse.json({
      user: { ...user, balance: Number(user.balance), miningLevel: Number(user.mining_level), lastClaimTime: Number(user.last_claim_time), pendingEarnings: calculatePendingEarnings(Number(user.last_claim_time), Number(user.mining_level)) },
      level: getMiningLevel(Number(user.mining_level)),
    });
  } catch (error) {
    console.error('Failed to load user', error);
    return errorResponse('Unable to load user data', 500);
  }
}

export async function POST(request: Request) {
  let body: UserPayload & { action?: 'claim' | 'wallet' | 'upgrade'; walletAddress?: string; level?: MiningLevel };
  try { body = await request.json(); } catch { return errorResponse('Invalid JSON body'); }
  if (!validateTelegramId(body.telegramId)) return errorResponse('A valid telegramId is required');
  if (!isTelegramRequestAuthorized(request.headers.get('x-telegram-init-data'), body.telegramId)) return errorResponse('Telegram authentication failed', 401);

  try {
    await ensureUsersTable();
    if (body.action === 'wallet') {
      if (typeof body.walletAddress !== 'string' || body.walletAddress.length > 255) return errorResponse('Invalid wallet address');
      const rows = await sql!`UPDATE users SET wallet_address = ${body.walletAddress.trim()} WHERE telegram_id = ${body.telegramId} RETURNING wallet_address`;
      if (!rows.length) return errorResponse('User not found', 404);
      return NextResponse.json({ walletAddress: rows[0].wallet_address });
    }
    if (body.action === 'upgrade') {
      const requestedLevel = body.level;
      if (typeof requestedLevel !== 'number' || !Number.isInteger(requestedLevel) || requestedLevel < 2 || requestedLevel > 5) return errorResponse('Invalid mining level');
      const target = getMiningLevel(requestedLevel);
      const rows = await sql!`
        UPDATE users SET balance = balance - ${target.upgradeCost}, mining_level = ${requestedLevel}
        WHERE telegram_id = ${body.telegramId} AND mining_level = ${requestedLevel - 1} AND balance >= ${target.upgradeCost}
        RETURNING balance::text, mining_level
      `;
      if (!rows.length) return errorResponse('Insufficient balance or invalid upgrade', 409);
      return NextResponse.json({ balance: Number(rows[0].balance), miningLevel: Number(rows[0].mining_level) });
    }
    if (body.action !== 'claim') return errorResponse('Unsupported action');
    const now = Date.now();
    const rows = await sql!`
      UPDATE users
      SET balance = balance + (((${now}::BIGINT - last_claim_time)::NUMERIC / 3600000) * CASE mining_level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 60 WHEN 4 THEN 150 WHEN 5 THEN 400 ELSE 10 END), last_claim_time = ${now}
      WHERE telegram_id = ${body.telegramId}
      RETURNING balance::text, mining_level, last_claim_time
    `;
    if (!rows.length) return errorResponse('User not found', 404);
    return NextResponse.json({ balance: Number(rows[0].balance), miningLevel: Number(rows[0].mining_level), lastClaimTime: Number(rows[0].last_claim_time), pendingEarnings: 0 });
  } catch (error) {
    console.error('Failed to update user', error);
    return errorResponse('Unable to update user data', 500);
  }
}
