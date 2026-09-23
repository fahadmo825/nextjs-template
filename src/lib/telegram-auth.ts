import { createHmac, timingSafeEqual } from 'node:crypto';

function hexHmac(key: string | Buffer, value: string) {
  return createHmac('sha256', key).update(value).digest('hex');
}

export function isTelegramRequestAuthorized(rawInitData: string | null, telegramId: string, botToken = process.env.TELEGRAM_BOT_TOKEN) {
  if (process.env.NODE_ENV !== 'production' && !rawInitData) return true;
  if (!rawInitData || !botToken) return false;
  const params = new URLSearchParams(rawInitData);
  const receivedHash = params.get('hash');
  if (!receivedHash) return false;
  params.delete('hash');
  const dataCheckString = [...params.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}=${value}`).join('\n');
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expectedHash = hexHmac(secretKey, dataCheckString);
  const hashMatches = receivedHash.length === expectedHash.length && timingSafeEqual(Buffer.from(receivedHash), Buffer.from(expectedHash));
  if (!hashMatches) return false;
  try {
    const user = JSON.parse(params.get('user') || '{}') as { id?: number };
    return String(user.id ?? '') === telegramId;
  } catch {
    return false;
  }
}
