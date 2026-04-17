import { prisma } from '@/lib/prisma';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  BankConnectionRecord,
  BankConnectionsRepository,
  CreateBankConnectionSchema,
  UpdateBankConnectionSchema,
} from '../bank-connections-repository';

function toPersisted(raw: Record<string, unknown>): BankConnectionRecord {
  return {
    id: raw.id as string,
    tenantId: raw.tenantId as string,
    bankAccountId: raw.bankAccountId as string,
    provider: raw.provider as string,
    externalItemId: raw.externalItemId as string,
    accessToken: raw.accessToken as string,
    status: raw.status as string,
    lastSyncAt: raw.lastSyncAt as Date | null,
    createdAt: raw.createdAt as Date,
    updatedAt: raw.updatedAt as Date,
  };
}

export class PrismaBankConnectionsRepository
  implements BankConnectionsRepository
{
  async create(
    data: CreateBankConnectionSchema,
  ): Promise<BankConnectionRecord> {
    const record = await prisma.bankConnection.create({
      data: {
        tenantId: data.tenantId,
        bankAccountId: data.bankAccountId,
        provider: data.provider ?? 'PLUGGY',
        externalItemId: data.externalItemId,
        accessToken: data.accessToken,
      },
    });

    return toPersisted(record as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<BankConnectionRecord | null> {
    const record = await prisma.bankConnection.findFirst({
      where: { id: id.toString(), tenantId },
    });

    return record
      ? toPersisted(record as unknown as Record<string, unknown>)
      : null;
  }

  async findByBankAccountId(
    bankAccountId: string,
    tenantId: string,
  ): Promise<BankConnectionRecord | null> {
    const record = await prisma.bankConnection.findFirst({
      where: {
        bankAccountId,
        tenantId,
        status: { not: 'REVOKED' },
      },
    });

    return record
      ? toPersisted(record as unknown as Record<string, unknown>)
      : null;
  }

  async findMany(tenantId: string): Promise<BankConnectionRecord[]> {
    const records = await prisma.bankConnection.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) =>
      toPersisted(r as unknown as Record<string, unknown>),
    );
  }

  async update(
    data: UpdateBankConnectionSchema,
  ): Promise<BankConnectionRecord | null> {
    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.accessToken !== undefined)
      updateData.accessToken = data.accessToken;
    if (data.lastSyncAt !== undefined) updateData.lastSyncAt = data.lastSyncAt;

    const result = await prisma.bankConnection.updateMany({
      where: { id: data.id.toString(), tenantId: data.tenantId },
      data: updateData,
    });

    if (result.count === 0) return null;

    const record = await prisma.bankConnection.findUnique({
      where: { id: data.id.toString() },
    });

    return record
      ? toPersisted(record as unknown as Record<string, unknown>)
      : null;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.bankConnection.deleteMany({
      where: { id: id.toString(), tenantId },
    });
  }
}
