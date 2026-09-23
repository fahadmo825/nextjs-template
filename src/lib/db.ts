import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

export const sql = connectionString ? neon(connectionString) : null;

export async function ensureUsersTable() {
  if (!sql) {
    throw new Error('DATABASE_URL is not configured');
  }

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      telegram_id VARCHAR PRIMARY KEY,
      username VARCHAR,
      balance NUMERIC NOT NULL DEFAULT 0,
      mining_level INT NOT NULL DEFAULT 1,
      last_claim_time BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
      wallet_address VARCHAR NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
}
