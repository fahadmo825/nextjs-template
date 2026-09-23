import { NextResponse } from 'next/server';
import { getMiningLevel, serializeUser } from '@/lib/mining';
import { ensureSchema, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

function getTelegramId(value: unknown) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_:-]{1,128}$/.test(value)) return null;
  return value;
}

async function findOrCreateUser(telegramId: string, username?: string | null) {
  await ensureSchema();
  const rows = await sql`
    INSERT INTO users (telegram_id, username)
    VALUES (${telegramId}, ${username || null})
    ON CONFLICT (telegram_id) DO UPDATE SET username = COALESCE(EXCLUDED.username, users.username)
    RETURNING telegram_id, username, balance, mining_level, last_claim_time, wallet_address, created_at
  `;
  return serializeUser(rows[0]);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const telegramId = getTelegramId(url.searchParams.get('telegram_id'));
    if (!telegramId) return NextResponse.json({ error: 'A valid telegram_id is required' }, { status: 400 });
    return NextResponse.json({ user: await findOrCreateUser(telegramId, url.searchParams.get('username')) });
  } catch (error) {
    console.error('GET /api/user failed', error);
    return NextResponse.json({ error: 'Unable to load user' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action?: string; telegramId?: unknown; username?: string | null; walletAddress?: unknown; targetLevel?: unknown };
    const telegramId = getTelegramId(body.telegramId);
    if (!telegramId) return NextResponse.json({ error: 'A valid telegramId is required' }, { status: 400 });
    await findOrCreateUser(telegramId, body.username);

    if (body.action === 'claim') {
      const rows = await sql`
        UPDATE users
        SET balance = balance + ((EXTRACT(EPOCH FROM NOW()) * 1000 - last_claim_time) / 3600000.0) *
          CASE mining_level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 60 WHEN 4 THEN 150 WHEN 5 THEN 400 ELSE 10 END,
          last_claim_time = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
        WHERE telegram_id = ${telegramId}
        RETURNING telegram_id, username, balance, mining_level, last_claim_time, wallet_address, created_at
      `;
      return NextResponse.json({ user: serializeUser(rows[0]), claimed: true });
    }

    if (body.action === 'wallet') {
      const walletAddress = typeof body.walletAddress === 'string' ? body.walletAddress.trim() : '';
      if (walletAddress.length > 255) return NextResponse.json({ error: 'Wallet address is too long' }, { status: 400 });
      const rows = await sql`
        UPDATE users SET wallet_address = ${walletAddress}
        WHERE telegram_id = ${telegramId}
        RETURNING telegram_id, username, balance, mining_level, last_claim_time, wallet_address, created_at
      `;
      return NextResponse.json({ user: serializeUser(rows[0]) });
    }

    if (body.action === 'upgrade') {
      const targetLevel = Number(body.targetLevel);
      if (!Number.isInteger(targetLevel) || targetLevel < 2 || targetLevel > 5) return NextResponse.json({ error: 'Invalid mining level' }, { status: 400 });
      const target = getMiningLevel(targetLevel);
      const rows = await sql`
        UPDATE users
        SET balance = balance - ${target.upgradeCost}, mining_level = ${targetLevel}
        WHERE telegram_id = ${telegramId} AND mining_level = ${targetLevel - 1} AND balance >= ${target.upgradeCost}
        RETURNING telegram_id, username, balance, mining_level, last_claim_time, wallet_address, created_at
      `;
      if (!rows[0]) return NextResponse.json({ error: 'Insufficient balance or invalid upgrade path' }, { status: 409 });
      return NextResponse.json({ user: serializeUser(rows[0]) });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/user failed', error);
    return NextResponse.json({ error: 'Unable to update user' }, { status: 500 });
  }
}
