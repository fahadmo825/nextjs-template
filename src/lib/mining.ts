export type MiningLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type MiningLevelConfig = {
  level: MiningLevel;
  name: string;
  upgradeCost: number;
  hashrateThs: number;
  speedPerHour: number;
};

export const MINING_LEVELS: MiningLevelConfig[] = [
  { level: 1, name: 'Basic Miner', upgradeCost: 0, hashrateThs: 0.10, speedPerHour: 5 },
  { level: 2, name: 'Advanced Miner', upgradeCost: 100, hashrateThs: 0.10, speedPerHour: 5 },
  { level: 3, name: 'Pro Rig', upgradeCost: 2000, hashrateThs: 0.10, speedPerHour: 5 },
  { level: 4, name: 'Super Node', upgradeCost: 5000, hashrateThs: 0.10, speedPerHour: 5 },
  { level: 5, name: 'Quantum Node', upgradeCost: 15000, hashrateThs: 0.10, speedPerHour: 5 },
  { level: 6, name: 'Hyper Node', upgradeCost: 25000, hashrateThs: 0.10, speedPerHour: 5 },
  { level: 7, name: 'Apex Rig', upgradeCost: 40000, hashrateThs: 0.11, speedPerHour: 5.5 },
  { level: 8, name: 'Nova Rig', upgradeCost: 60000, hashrateThs: 0.11, speedPerHour: 5.5 },
  { level: 9, name: 'Titan Node', upgradeCost: 85000, hashrateThs: 0.11, speedPerHour: 5.5 },
  { level: 10, name: 'Orbit Node', upgradeCost: 115000, hashrateThs: 0.11, speedPerHour: 5.5 },
  { level: 11, name: 'Fusion Node', upgradeCost: 150000, hashrateThs: 0.11, speedPerHour: 5.5 },
  { level: 12, name: 'Quantum Core', upgradeCost: 200000, hashrateThs: 0.12, speedPerHour: 6 },
];

export function getMiningLevel(level: number): MiningLevelConfig {
  return MINING_LEVELS.find((item) => item.level === level) ?? MINING_LEVELS[0];
}

export function calculatePendingEarnings(lastClaimTime: number, level: number, now = Date.now()) {
  const elapsedHours = Math.max(0, now - lastClaimTime) / (60 * 60 * 1000);
  return elapsedHours * getMiningLevel(level).speedPerHour;
}
