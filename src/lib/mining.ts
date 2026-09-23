export type MiningLevel = 1 | 2 | 3 | 4 | 5;

export type MiningLevelConfig = {
  level: MiningLevel;
  name: string;
  upgradeCost: number;
  speedPerHour: number;
};

export const MINING_LEVELS: MiningLevelConfig[] = [
  { level: 1, name: 'Basic Miner', upgradeCost: 0, speedPerHour: 10 },
  { level: 2, name: 'Advanced Miner', upgradeCost: 500, speedPerHour: 25 },
  { level: 3, name: 'Pro Rig', upgradeCost: 2000, speedPerHour: 60 },
  { level: 4, name: 'Super Node', upgradeCost: 5000, speedPerHour: 150 },
  { level: 5, name: 'Quantum Node', upgradeCost: 15000, speedPerHour: 400 },
];

export function getMiningLevel(level: number): MiningLevelConfig {
  return MINING_LEVELS.find((item) => item.level === level) ?? MINING_LEVELS[0];
}

export function calculatePendingEarnings(lastClaimTime: number, level: number, now = Date.now()) {
  const elapsedHours = Math.max(0, now - lastClaimTime) / (60 * 60 * 1000);
  return elapsedHours * getMiningLevel(level).speedPerHour;
}
