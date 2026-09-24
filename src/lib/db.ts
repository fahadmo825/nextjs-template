import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_9dfVgTLZWX8x@ep-tiny-dust-b56nlkx1-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const sql = neon(connectionString);

export async function ensureUsersTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      telegram_id VARCHAR PRIMARY KEY,
      username VARCHAR,
      balance NUMERIC NOT NULL DEFAULT 0,
      referral_count INT NOT NULL DEFAULT 0,
      mining_level INT NOT NULL DEFAULT 1,
      last_claim_time BIGINT NOT NULL DEFAULT 0,
      wallet_address VARCHAR NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_count INT NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE users ALTER COLUMN last_claim_time SET DEFAULT 0`;
}
