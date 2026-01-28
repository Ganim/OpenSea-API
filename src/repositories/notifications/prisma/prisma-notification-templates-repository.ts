import type { NotificationTemplate } from '@/entities/notifications/notification-template';
import { prisma } from '@/lib/prisma';
import { notificationTemplatePrismaToDomain } from '@/mappers/notifications/notification-template-prisma-to-domain';
import type {
  NotificationChannel as PrismaNotificationChannel,
  NotificationPriority as PrismaNotificationPriority,
} from '@prisma/generated/client.js';
import type {
  CreateTemplateSchema,
  NotificationTemplatesRepository,
} from '../notification-templates-repository';

export class PrismaNotificationTemplatesRepository
  implements NotificationTemplatesRepository
{
  async create(data: CreateTemplateSchema): Promise<NotificationTemplate> {
    const created = await prisma.notificationTemplate.create({
      data: {
        code: data.code,
        name: data.name,
        titleTemplate: data.titleTemplate,
        messageTemplate: data.messageTemplate,
        defaultChannel: data.defaultChannel as PrismaNotificationChannel,
        defaultPriority: (data.defaultPriority ??
          'NORMAL') as PrismaNotificationPriority,
      },
    });

    return notificationTemplatePrismaToDomain(created);
  }

  async findByCode(code: string): Promise<NotificationTemplate | null> {
    const found = await prisma.notificationTemplate.findUnique({
      where: { code },
    });
    if (!found) return null;
    return notificationTemplatePrismaToDomain(found);
  }

  async findById(id: string): Promise<NotificationTemplate | null> {
    const found = await prisma.notificationTemplate.findUnique({
      where: { id },
    });
    if (!found) return null;
    return notificationTemplatePrismaToDomain(found);
  }

  async listActive(): Promise<NotificationTemplate[]> {
    const rows = await prisma.notificationTemplate.findMany({
      where: { isActive: true, deletedAt: null },
    });
    return rows.map(notificationTemplatePrismaToDomain);
  }

  async save(template: NotificationTemplate): Promise<void> {
    await prisma.notificationTemplate.update({
      where: { id: template.id.toString() },
      data: {
        code: template.code,
        name: template.name,
        titleTemplate: template.titleTemplate,
        messageTemplate: template.messageTemplate,
        defaultChannel: template.defaultChannel as PrismaNotificationChannel,
        defaultPriority: template.defaultPriority as PrismaNotificationPriority,
        isActive: template.isActive,
        updatedAt: new Date(),
        deletedAt: template.deletedAt,
      },
    });
  }
}
