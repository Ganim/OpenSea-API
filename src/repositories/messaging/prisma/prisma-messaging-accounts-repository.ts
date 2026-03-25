import { MessagingAccount } from '@/entities/messaging/messaging-account';
import type { MessagingAccountStatus } from '@/entities/messaging/messaging-account-status.enum';
import type { MessagingChannel } from '@/entities/messaging/messaging-channel.enum';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma, Prisma } from '@/lib/prisma';
import {
  MessagingChannel as PrismaMessagingChannel,
  MessagingAccountStatus as PrismaMessagingAccountStatus,
} from '@prisma/generated/client.js';
import type { MessagingAccountsRepository } from '../messaging-accounts-repository';

function toDomain(raw: Record<string, unknown>): MessagingAccount {
  return MessagingAccount.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId as string),
      channel: raw.channel as MessagingChannel,
      name: raw.name as string,
      status: raw.status as MessagingAccountStatus,
      phoneNumber: (raw.phoneNumber as string) ?? null,
      wabaId: (raw.wabaId as string) ?? null,
      igAccountId: (raw.igAccountId as string) ?? null,
      tgBotToken: (raw.tgBotToken as string) ?? null,
      tgBotUsername: (raw.tgBotUsername as string) ?? null,
      accessToken: (raw.accessToken as string) ?? null,
      refreshToken: (raw.refreshToken as string) ?? null,
      tokenExpiresAt: (raw.tokenExpiresAt as Date) ?? null,
      webhookUrl: (raw.webhookUrl as string) ?? null,
      webhookSecret: (raw.webhookSecret as string) ?? null,
      settings: (raw.settings as Record<string, unknown>) ?? null,
      createdAt: raw.createdAt as Date,
      updatedAt: raw.updatedAt as Date,
    },
    new UniqueEntityID(raw.id as string),
  );
}

export class PrismaMessagingAccountsRepository
  implements MessagingAccountsRepository
{
  async findById(id: string): Promise<MessagingAccount | null> {
    const accountRecord = await prisma.messagingAccount.findUnique({
      where: { id },
    });

    return accountRecord
      ? toDomain(accountRecord as Record<string, unknown>)
      : null;
  }

  async findByTenantAndChannel(
    tenantId: string,
    channel: string,
  ): Promise<MessagingAccount[]> {
    const accountRecords = await prisma.messagingAccount.findMany({
      where: { tenantId, channel: channel as PrismaMessagingChannel },
    });

    return accountRecords.map((record) =>
      toDomain(record as unknown as Record<string, unknown>),
    );
  }

  async findByTenantId(tenantId: string): Promise<MessagingAccount[]> {
    const accountRecords = await prisma.messagingAccount.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return accountRecords.map((record) =>
      toDomain(record as unknown as Record<string, unknown>),
    );
  }

  async create(account: MessagingAccount): Promise<void> {
    await prisma.messagingAccount.create({
      data: {
        id: account.id.toString(),
        tenantId: account.tenantId.toString(),
        channel: account.channel as unknown as PrismaMessagingChannel,
        name: account.name,
        status:
          account.status as unknown as PrismaMessagingAccountStatus,
        phoneNumber: account.phoneNumber,
        wabaId: account.wabaId,
        igAccountId: account.igAccountId,
        tgBotToken: account.tgBotToken,
        tgBotUsername: account.tgBotUsername,
        accessToken: account.accessToken,
        refreshToken: account.refreshToken,
        tokenExpiresAt: account.tokenExpiresAt,
        webhookUrl: account.webhookUrl,
        webhookSecret: account.webhookSecret,
        settings:
          (account.settings as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      },
    });
  }

  async save(account: MessagingAccount): Promise<void> {
    await prisma.messagingAccount.update({
      where: { id: account.id.toString() },
      data: {
        name: account.name,
        status: account.status as any,
        phoneNumber: account.phoneNumber,
        wabaId: account.wabaId,
        igAccountId: account.igAccountId,
        tgBotToken: account.tgBotToken,
        tgBotUsername: account.tgBotUsername,
        accessToken: account.accessToken,
        refreshToken: account.refreshToken,
        tokenExpiresAt: account.tokenExpiresAt,
        webhookUrl: account.webhookUrl,
        webhookSecret: account.webhookSecret,
        settings:
          (account.settings as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  }

  async delete(id: string): Promise<void> {
  