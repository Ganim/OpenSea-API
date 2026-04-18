import { prisma } from '@/lib/prisma.js';
import type {
  NotificationCategory as PrismaCategory,
  NotificationPreferenceV2 as PrismaPrefV2,
  UserNotificationSettings as PrismaSettings,
  NotificationModuleSetting as PrismaModuleSetting,
} from '../../../../../prisma/generated/prisma/client.js';

export class NotificationSettingsPrismaRepository {
  async getCategoryByCode(code: string): Promise<PrismaCategory | null> {
    return prisma.notificationCategory.findUnique({ where: { code } });
  }

  async getUserSettings(params: {
    userId: string;
    tenantId: string;
  }): Promise<PrismaSettings | null> {
    const { userId, tenantId } = params;
    return prisma.userNotificationSettings.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });
  }

  async getModuleSetting(params: {
    userId: string;
    tenantId: string;
    module: string;
  }): Promise<PrismaModuleSetting | null> {
    const { userId, tenantId, module } = params;
    return prisma.notificationModuleSetting.findUnique({
      where: { userId_tenantId_module: { userId, tenantId, module } },
    });
  }

  async getCategoryPreference(params: {
    userId: string;
    tenantId: string;
    categoryId: string;
    channel: string;
  }): Promise<PrismaPrefV2 | null> {
    const { userId, tenantId, categoryId, channel } = params;
    return prisma.notificationPreferenceV2.findUnique({
      where: {
        userId_tenantId_categoryId_channel: {
          userId,
          tenantId,
          categoryId,
          // cast because Prisma enum is branded
          channel: channel as unknown as PrismaPrefV2['channel'],
        },
      },
    });
  }

  async upsertCategory(params: {
    code: string;
    module: string;
    name: string;
    description?: string;
    icon?: string;
    defaultKind: string;
    defaultPriority: string;
    defaultChannels: string[];
    digestSupported: boolean;
    mandatory: boolean;
    order: number;
  }): Promise<PrismaCategory> {
    const {
      code,
      module,
      name,
      description,
      icon,
      defaultKind,
      defaultPriority,
      defaultChannels,
      digestSupported,
      mandatory,
      order,
    } = params;
    return prisma.notificationCategory.upsert({
      where: { code },
      update: {
        module,
        name,
        description,
        icon,
        defaultKind: defaultKind as PrismaCategory['defaultKind'],
        defaultPriority: defaultPriority as PrismaCategory['defaultPriority'],
        defaultChannels,
        digestSupported,
        mandatory,
        order,
        isActive: true,
      },
      create: {
        code,
        module,
        name,
        description,
        icon,
        defaultKind: defaultKind as PrismaCategory['defaultKind'],
        defaultPriority: defaultPriority as PrismaCategory['defaultPriority'],
        defaultChannels,
        digestSupported,
        mandatory,
        order,
      },
    });
  }

  async upsertModuleRegistry(params: {
    code: string;
    displayName: string;
    icon?: string;
    order: number;
  }): Promise<void> {
    const { code, displayName, icon, order } = params;
    await prisma.notificationModuleRegistry.upsert({
      where: { code },
      update: { displayName, icon, order, isActive: true },
      create: { code, displayName, icon, order },
    });
  }

  async deactivateMissingCategories(params: {
    module: string;
    keepCodes: string[];
  }): Promise<void> {
    const { module, keepCodes } = params;
    await prisma.notificationCategory.updateMany({
      where: { module, code: { notIn: keepCodes }, isActive: true },
      data: { isActive: false },
    });
  }
}
