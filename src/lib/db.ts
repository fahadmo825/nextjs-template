import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to use the mining API');
}

export const sql = neon(process.env.DATABASE_URL);

let schemaPromise: Promise<unknown> | undefined;

export function ensureSchema() {
  schemaPromise ??= sql`
    CREATE TABLE IF NOT EXISTS users (
      telegram_id VARCHAR PRIMARY KEY,
      username VARCHAR,
      balance NUMERIC DEFAULT 0,
      mining_level INT DEFAULT 1,
      last_claim_time BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
      wallet_address VARCHAR DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  return schemaPromise;
}
