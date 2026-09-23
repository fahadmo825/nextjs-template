export type MiningLevel = {
  level: number;
  name: string;
  upgradeCost: number;
  hourlyRate: number;
};

export const MINING_LEVELS: MiningLevel[] = [
  { level: 1, name: 'Basic Miner', upgradeCost: 0, hourlyRate: 10 },
  { level: 2, name: 'Advanced Miner', upgradeCost: 500, hourlyRate: 25 },
  { level: 3, name: 'Pro Rig', upgradeCost: 2000, hourlyRate: 60 },
  { level: 4, name: 'Super Node', upgradeCost: 5000, hourlyRate: 150 },
  { level: 5, name: 'Quantum Node', upgradeCost: 15000, hourlyRate: 400 },
];

export const DEFAULT_TELEGRAM_ID = 'local-preview';

export function getMiningLevel(level: number) {
  return MINING_LEVELS.find((item) => item.level === level) ?? MINING_LEVELS[0];
}

export function getUnclaimedEarnings(lastClaimTime: number, level: number, now = Date.now()) {
  return Math.max(0, ((now - lastClaimTime) / 3_600_000) * getMiningLevel(level).hourlyRate);
}

export type UserRecord = {
  telegramId: string;
  username: string | null;
  balance: number;
  miningLevel: number;
  lastClaimTime: number;
  walletAddress: string;
  createdAt: string;
};

export function serializeUser(row: Record<string, unknown>): UserRecord {
  return {
    telegramId: String(row.telegram_id),
    username: row.username ? String(row.username) : null,
    balance: Number(row.balance),
    miningLevel: Number(row.mining_level),
    lastClaimTime: Number(row.last_claim_time),
    walletAddress: String(row.wallet_address ?? ''),
    createdAt: String(row.created_at),
  };
}
