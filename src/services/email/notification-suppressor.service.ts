import { getRedisClient } from '@/lib/redis';

const SUPPRESSOR_TTL_SECONDS = 600; // 10 minutes
const PREFIX = 'email:suppress';

export class NotificationSuppressorService {
  async suppress(
    accountId: string,
    folder: string,
    identifier: string,
  ): Promise<void> {
    const key = `${PREFIX}:${accountId}:${folder}:${identifier}`;
    await getRedisClient().set(key, '1', 'EX', SUPPRESSOR_TTL_SECONDS);
  }

  async isSuppressed(
    accountId: string,
    folder: string,
    identifier: string,
  ): Promise<boolean> {
    const key = `${PREFIX}:${accountId}:${folder}:${identifier}`;
    const result = await getRedisClient().get(key);
    if (result) {
      await getRedisClient().del(key); // consume the suppressor
      return true;
    }
    return false;
  }
}

let instance: NotificationSuppressorService | null = null;

export function getNotificationSuppressor(): NotificationSuppressorService {
  if (!instance) {
    instance = new NotificationSuppressorService();
  }
  return instance;
}
