import type {
  NotificationChannel as PrismaChannel,
  NotificationCategory as PrismaCategory,
} from '../../../../prisma/generated/prisma/client.js';

import { NotificationSettingsPrismaRepository } from '../infrastructure/repositories/notification-settings-prisma-repository.js';
import { NotificationChannel, NotificationPriority } from '../public/types.js';

const CHANNEL_MASTER_MAP: Record<NotificationChannel, keyof MasterFlags> = {
  [NotificationChannel.IN_APP]: 'masterInApp',
  [NotificationChannel.EMAIL]: 'masterEmail',
  [NotificationChannel.PUSH]: 'masterPush',
  [NotificationChannel.SMS]: 'masterSms',
  [NotificationChannel.WHATSAPP]: 'masterWhatsapp',
};

interface MasterFlags {
  masterInApp: boolean;
  masterEmail: boolean;
  masterPush: boolean;
  masterSms: boolean;
  masterWhatsapp: boolean;
}

export interface ResolvePreferenceInput {
  userId: string;
  tenantId: string;
  category: PrismaCategory;
  channels: NotificationChannel[];
  priority: NotificationPriority;
}

export interface ResolvePreferenceResult {
  allowedChannels: NotificationChannel[];
  suppressedChannels: NotificationChannel[];
  reasons: Record<NotificationChannel, string | undefined>;
}

export class PreferenceResolver {
  constructor(
    private readonly settingsRepo: NotificationSettingsPrismaRepository,
  ) {}

  async resolve(
    input: ResolvePreferenceInput,
  ): Promise<ResolvePreferenceResult> {
    const { userId, tenantId, category, channels, priority } = input;

    const settings = await this.settingsRepo.getUserSettings({
      userId,
      tenantId,
    });

    const moduleSetting = await this.settingsRepo.getModuleSetting({
      userId,
      tenantId,
      module: category.module,
    });

    const allowed: NotificationChannel[] = [];
    const suppressed: NotificationChannel[] = [];
    const reasons: Record<NotificationChannel, string | undefined> = {
      [NotificationChannel.IN_APP]: undefined,
      [NotificationChannel.EMAIL]: undefined,
      [NotificationChannel.PUSH]: undefined,
      [NotificationChannel.SMS]: undefined,
      [NotificationChannel.WHATSAPP]: undefined,
    };

    const dndActive =
      settings?.doNotDisturb &&
      priority !== NotificationPriority.URGENT &&
      isWithinDnd(settings.dndStart, settings.dndEnd, settings.timezone);

    for (const channel of channels) {
      // 1. DND (blocks all except URGENT)
      if (dndActive) {
        suppressed.push(channel);
        reasons[channel] = 'dnd';
        continue;
      }

      // 2. Master channel toggle
      if (settings) {
        const masterKey = CHANNEL_MASTER_MAP[channel];
        if (!settings[masterKey]) {
          suppressed.push(channel);
          reasons[channel] = 'master_channel_off';
          continue;
        }
      } else {
        // No settings row yet — fall back to defaults:
        // IN_APP on, EMAIL on, PUSH/SMS/WHATSAPP off
        if (
          channel === NotificationChannel.PUSH ||
          channel === NotificationChannel.SMS ||
          channel === NotificationChannel.WHATSAPP
        ) {
          suppressed.push(channel);
          reasons[channel] = 'master_channel_off_default';
          continue;
        }
      }

      // 3. Module master toggle
      if (moduleSetting && !moduleSetting.isEnabled && !category.mandatory) {
        suppressed.push(channel);
        reasons[channel] = 'module_off';
        continue;
      }

      // 4. Category preference (per-channel)
      const pref = await this.settingsRepo.getCategoryPreference({
        userId,
        tenantId,
        categoryId: category.id,
        channel,
      });

      if (pref && !pref.isEnabled && !category.mandatory) {
        suppressed.push(channel);
        reasons[channel] = 'category_off';
        continue;
      }

      if (pref && pref.frequency === 'DISABLED' && !category.mandatory) {
        suppressed.push(channel);
        reasons[channel] = 'frequency_disabled';
        continue;
      }

      allowed.push(channel);
    }

    return {
      allowedChannels: allowed,
      suppressedChannels: suppressed,
      reasons,
    };
  }
}

function isWithinDnd(
  start: string | null,
  end: string | null,
  _tz: string | null,
): boolean {
  if (!start || !end) return false;
  // Simple same-day comparison in server time for now; timezone-aware
  // logic will be layered on in phase 6 when user timezones are enforced
  // from the frontend and stored uniformly.
  const now = new Date();
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (Number.isNaN(sh) || Number.isNaN(eh)) return false;
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const minutesStart = sh * 60 + (sm ?? 0);
  const minutesEnd = eh * 60 + (em ?? 0);
  if (minutesStart === minutesEnd) return false;
  if (minutesStart < minutesEnd) {
    return minutesNow >= minutesStart && minutesNow < minutesEnd;
  }
  // Overnight window (e.g. 22:00 — 07:00)
  return minutesNow >= minutesStart || minutesNow < minutesEnd;
}

/** Utility used by the dispatcher to translate public enum values to Prisma channel column values. */
export function toPrismaChannel(channel: NotificationChannel): PrismaChannel {
  return channel as unknown as PrismaChannel;
}
