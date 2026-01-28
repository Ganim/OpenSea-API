import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import type {
  AlertTypeValue,
  NotificationChannelValue,
} from '@/entities/sales/notification-preference';
import { NotificationPreference } from '@/entities/sales/notification-preference';
import { prisma } from '@/lib/prisma';
import type {
  AlertType as PrismaAlertType,
  NotificationChannel as PrismaNotificationChannel,
} from '@prisma/generated/client.js';
import type {
  CreateNotificationPreferenceSchema,
  NotificationPreferencesRepository,
  UpdateNotificationPreferenceSchema,
} from '../notification-preferences-repository';

export class PrismaNotificationPreferencesRepository
  implements NotificationPreferencesRepository
{
  async create(
    data: CreateNotificationPreferenceSchema,
  ): Promise<NotificationPreference> {
    const preferenceData = await prisma.notificationPreference.create({
      data: {
        userId: data.userId.toString(),
        alertType: data.alertType as PrismaAlertType,
        channel: data.channel as PrismaNotificationChannel,
        isEnabled: data.isEnabled ?? true,
      },
    });

    return NotificationPreference.create(
      {
        userId: new EntityID(preferenceData.userId),
        alertType: preferenceData.alertType as AlertTypeValue,
        channel: preferenceData.channel as NotificationChannelValue,
        isEnabled: preferenceData.isEnabled,
        createdAt: preferenceData.createdAt,
        updatedAt: preferenceData.updatedAt,
        deletedAt: preferenceData.deletedAt ?? undefined,
      },
      new EntityID(preferenceData.id),
    );
  }

  async findById(id: UniqueEntityID): Promise<NotificationPreference | null> {
    const preferenceData = await prisma.notificationPreference.findUnique({
      where: { id: id.toString() },
    });

    if (!preferenceData) return null;

    return NotificationPreference.create(
      {
        userId: new EntityID(preferenceData.userId),
        alertType: preferenceData.alertType as AlertTypeValue,
        channel: preferenceData.channel as NotificationChannelValue,
        isEnabled: preferenceData.isEnabled,
        createdAt: preferenceData.createdAt,
        updatedAt: preferenceData.updatedAt,
        deletedAt: preferenceData.deletedAt ?? undefined,
      },
      new EntityID(preferenceData.id),
    );
  }

  async findByUserAndAlertType(
    userId: UniqueEntityID,
    alertType: AlertTypeValue,
  ): Promise<NotificationPreference[]> {
    const preferencesData = await prisma.notificationPreference.findMany({
      where: {
        userId: userId.toString(),
        alertType: alertType as PrismaAlertType,
      },
    });

    return preferencesData.map((preferenceData) =>
      NotificationPreference.create(
        {
          userId: new EntityID(preferenceData.userId),
          alertType: preferenceData.alertType as AlertTypeValue,
          channel: preferenceData.channel as NotificationChannelValue,
          isEnabled: preferenceData.isEnabled,
          createdAt: preferenceData.createdAt,
          updatedAt: preferenceData.updatedAt,
          deletedAt: preferenceData.deletedAt ?? undefined,
        },
        new EntityID(preferenceData.id),
      ),
    );
  }

  async findByUserAndChannel(
    userId: UniqueEntityID,
    channel: NotificationChannelValue,
  ): Promise<NotificationPreference[]> {
    const preferencesData = await prisma.notificationPreference.findMany({
      where: {
        userId: userId.toString(),
        channel: channel as PrismaNotificationChannel,
      },
    });

    return preferencesData.map((preferenceData) =>
      NotificationPreference.create(
        {
          userId: new EntityID(preferenceData.userId),
          alertType: preferenceData.alertType as AlertTypeValue,
          channel: preferenceData.channel as NotificationChannelValue,
          isEnabled: preferenceData.isEnabled,
          createdAt: preferenceData.createdAt,
          updatedAt: preferenceData.updatedAt,
          deletedAt: preferenceData.deletedAt ?? undefined,
        },
        new EntityID(preferenceData.id),
      ),
    );
  }

  async findManyByUser(
    userId: UniqueEntityID,
  ): Promise<NotificationPreference[]> {
    const preferencesData = await prisma.notificationPreference.findMany({
      where: {
        userId: userId.toString(),
      },
    });

    return preferencesData.map((preferenceData) =>
      NotificationPreference.create(
        {
          userId: new EntityID(preferenceData.userId),
          alertType: preferenceData.alertType as AlertTypeValue,
          channel: preferenceData.channel as NotificationChannelValue,
          isEnabled: preferenceData.isEnabled,
          createdAt: preferenceData.createdAt,
          updatedAt: preferenceData.updatedAt,
          deletedAt: preferenceData.deletedAt ?? undefined,
        },
        new EntityID(preferenceData.id),
      ),
    );
  }

  async findManyEnabled(
    userId: UniqueEntityID,
  ): Promise<NotificationPreference[]> {
    const preferencesData = await prisma.notificationPreference.findMany({
      where: {
        userId: userId.toString(),
        isEnabled: true,
      },
    });

    return preferencesData.map((preferenceData) =>
      NotificationPreference.create(
        {
          userId: new EntityID(preferenceData.userId),
          alertType: preferenceData.alertType as AlertTypeValue,
          channel: preferenceData.channel as NotificationChannelValue,
          isEnabled: preferenceData.isEnabled,
          createdAt: preferenceData.createdAt,
          updatedAt: preferenceData.updatedAt,
          deletedAt: preferenceData.deletedAt ?? undefined,
        },
        new EntityID(preferenceData.id),
      ),
    );
  }

  async update(
    data: UpdateNotificationPreferenceSchema,
  ): Promise<NotificationPreference | null> {
    try {
      const preferenceData = await prisma.notificationPreference.update({
        where: { id: data.id.toString() },
        data: {
          isEnabled: data.isEnabled,
        },
      });

      return NotificationPreference.create(
        {
          userId: new EntityID(preferenceData.userId),
          alertType: preferenceData.alertType as AlertTypeValue,
          channel: preferenceData.channel as NotificationChannelValue,
          isEnabled: preferenceData.isEnabled,
          createdAt: preferenceData.createdAt,
          updatedAt: preferenceData.updatedAt,
          deletedAt: preferenceData.deletedAt ?? undefined,
        },
        new EntityID(preferenceData.id),
      );
    } catch {
      return null;
    }
  }

  async save(preference: NotificationPreference): Promise<void> {
    await prisma.notificationPreference.upsert({
      where: { id: preference.id.toString() },
      create: {
        id: preference.id.toString(),
        userId: preference.userId.toString(),
        alertType: preference.alertType as PrismaAlertType,
        channel: preference.channel as PrismaNotificationChannel,
        isEnabled: preference.isEnabled,
        createdAt: preference.createdAt,
        updatedAt: preference.updatedAt ?? new Date(),
        deletedAt: preference.deletedAt,
      },
      update: {
        isEnabled: preference.isEnabled,
        updatedAt: preference.updatedAt ?? new Date(),
        deletedAt: preference.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.notificationPreference.update({
      where: { id: id.toString() },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
